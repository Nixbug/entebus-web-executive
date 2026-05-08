<script lang="ts">
	import { goto } from '$app/navigation';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import { fetchServiceList, updateService } from '$lib/services/company-services';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import {
		SERVICE_STATUS_LABEL_BY_VALUE,
		SERVICE_STATUS_FILTER_OPTIONS,
		SERVICE_STATUS_VALUE_BY_LABEL
	} from '$lib/constants';
	import { page } from '$app/stores';
	import FilterOnly from '$lib/components/FilterOnly.svelte';
	import { utcToIstRelativeFormat } from '$lib/helpers';
	import DateFilterComponent from '$lib/components/DateFilterComponent.svelte';
	import { canUpdateService } from '$lib/utils/permissions';
	let companyId: string | null = null;
	$: companyId =
		$page.url.searchParams.get('companyId') ?? $page.url.searchParams.get('id') ?? null;

	//-- IST date helpers --
	function todayIst(): string {
		const now = new Date();
		const ist = new Date(now.getTime() + (5 * 60 + 30) * 60_000);
		return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`;
	}

	/** Convert a YYYY-MM-DD (IST) to UTC ISO string at IST midnight (prev day 18:30 UTC) */
	function toUtcStartOfIstDay(date: string): string {
		return new Date(`${date}T00:00:00+05:30`).toISOString();
	}

	/** Convert a YYYY-MM-DD (IST) to UTC ISO string at IST 23:59:59 (same day 18:29:59 UTC) */
	function toUtcEndOfIstDay(date: string): string {
		return new Date(`${date}T23:59:59+05:30`).toISOString();
	}

	//-- Date range state — default: today --
	let fromDate = todayIst();
	let toDate = todayIst();

	//-- Service list state --
	let services: any[] = [];
	let loading = false;
	let selectedIds = new Set<number>();
	//-- Filter state --
	let activeFilters: Record<string, string> = { status: 'All Status' };

	async function fetchServices() {
		loading = true;
		selectedIds = new Set();
		try {
			const PAGE_SIZE = 100;
			let offset = 0;
			let all: any[] = [];
			while (true) {
				const statusFilter =
					activeFilters.status && !String(activeFilters.status).toLowerCase().startsWith('all')
						? SERVICE_STATUS_VALUE_BY_LABEL[String(activeFilters.status)]
						: undefined;
				const parsedCompanyId = companyId ? Number(companyId) : undefined;
				const validCompanyId =
					typeof parsedCompanyId === 'number' && Number.isFinite(parsedCompanyId)
						? parsedCompanyId
						: undefined;
				const page = await fetchServiceList({
					limit: PAGE_SIZE,
					offset,
					company_id: validCompanyId,
					starting_at_ge: toUtcStartOfIstDay(fromDate),
					starting_at_le: toUtcEndOfIstDay(toDate),
					status: statusFilter,
					order_by: 'starting_at',
					order_in: 'desc'
				});
				const results = Array.isArray(page) ? page : [];
				all = [...all, ...results];
				if (results.length < PAGE_SIZE) break;
				offset += PAGE_SIZE;
			}
			services = all;
		} catch (err: any) {
			const msg = await handleApiError(err);
			toast.error(msg || 'Failed to fetch services.');
		} finally {
			loading = false;
		}
	}

	$: if (fromDate && toDate && fromDate <= toDate) {
		fetchServices();
	}

	//-- Service status helpers --
	function canSelectService(status: number): boolean {
		return status === 4; // Only ended services can be selected
	}

	function getEndButtonTooltip(status: number): string {
		const labels: Record<number, string> = {
			1: 'Cannot end created service',
			2: 'Cannot end downloaded service',
			3: 'End this service',
			4: 'Service already ended',
			5: 'Cannot end audited service'
		};
		return labels[status] ?? 'Cannot end this service';
	}

	//-- Checkbox helpers --
	function toggleRow(id: number, status: number) {
		if (!canSelectService(status)) {
			toast.error('Only ended services can be selected for reports.');
			return;
		}
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}

	function toggleAll() {
		const selectableServices = services.filter((s) => canSelectService(s.status));
		if (selectedIds.size === selectableServices.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(selectableServices.map((s) => s.id));
		}
	}

	$: selectableCount = services.filter((s) => canSelectService(s.status)).length;
	$: allSelected = selectableCount > 0 && selectedIds.size === selectableCount;
	$: someSelected = selectedIds.size > 0 && !allSelected;

	function statusLabel(status: number): string {
		return (SERVICE_STATUS_LABEL_BY_VALUE as Record<number, string>)[status] ?? String(status);
	}

	function statusColor(status: number): string {
		const map: Record<number, string> = {
			1: '#6c757d', //-- Created --
			2: '#0d6efd', //-- Downloaded --
			3: '#198754', //-- Started --
			4: '#dc3545', //-- Ended --
			5: '#6f42c1' //-- Audited --
		};
		return map[status] ?? '#6c757d';
	}

	//-- End a started service --
	let endingIds = new Set<number>();

	async function endService(id: number) {
		if (!canUpdateService()) {
			toast.error('You do not have permission to end services.');
			return;
		}
		endingIds = new Set([...endingIds, id]);
		try {
			await updateService(id, { status: 4 });
			services = services.map((s) => (s.id === id ? { ...s, status: 4 } : s));
			toast.success('Service ended successfully.');
		} catch (err: any) {
			const msg = await handleApiError(err);
			toast.error(msg || 'Failed to end service.');
		} finally {
			const next = new Set(endingIds);
			next.delete(id);
			endingIds = next;
		}
	}

	//-- Navigate to report detail for selected services --
	function generateReport() {
		const ids = [...selectedIds].join(',');
		const params = new URLSearchParams({ ids, from: fromDate, to: toDate });
		goto(`/company/service-report/detail?${params.toString()}`);
	}
</script>

<div class="main-div d-flex flex-column min-vh-100">
	<div class="sticky-top">
		<HeaderBar />
	</div>

	<main class="container-xl py-4 page-wrapper">
		<HomeButton
			icon="bi bi-arrow-left"
			ariaLabel="Back"
			to="/company/dashboard"
			preserveQuery={true}
		/>

		<!-- Page title + date filter -->
		<div class="top-bar">
			<div class="page-title-block">
				<h1 class="page-title">Service Reports</h1>
				<p class="page-sub">Select services and generate a collection report.</p>
			</div>

			<div class="date-filter-bar">
				<div class="date-cmp-wrap">
					<DateFilterComponent
						{fromDate}
						{toDate}
						label="Report Date Range"
						onChange={(dates) => {
							fromDate = dates.from;
							toDate = dates.to;
							fetchServices();
						}}
					/>
				</div>

				<!-- Status filter -->
				<FilterOnly
					label="Status"
					options={SERVICE_STATUS_FILTER_OPTIONS}
					value={activeFilters.status}
					on:update={(e: any) => {
						activeFilters = { ...activeFilters, status: e.detail.value };
						fetchServices();
					}}
				/>
				{#if selectedIds.size > 0}
					<button class="gen-btn gen-btn--top" type="button" on:click={generateReport}>
						<i class="bi bi-file-earmark-bar-graph"></i>
						Generate Report
					</button>
				{/if}
			</div>
		</div>

		<!-- Services table -->
		{#if loading}
			<div class="state-box">
				<div class="spinner-border text-primary" role="status" style="width:2.5rem;height:2.5rem;">
					<span class="visually-hidden">Loading…</span>
				</div>
				<p>Loading services…</p>
			</div>
		{:else if services.length === 0}
			<div class="state-box">
				<i class="bi bi-inbox empty-icon"></i>
				<p class="empty-title">No data available for the selected criteria</p>
				<p class="empty-sub">Try adjusting the date range.</p>
			</div>
		{:else}
			<div class="table-card">
				<div class="table-scroll">
					<table class="svc-table">
						<thead>
							<tr>
								<th class="col-check">
									<input
										type="checkbox"
										class="form-check-input"
										checked={allSelected}
										indeterminate={someSelected}
										on:change={toggleAll}
									/>
								</th>
								<th>ID</th>
								<th>Service Name</th>
								<th>Status</th>
								<th>Starting Date</th>
								<th class="col-action">End Service</th>
								<th class="col-action">Detail</th>
							</tr>
						</thead>
						<tbody>
							{#each services as svc (svc.id)}
								<tr
									class:row-selected={selectedIds.has(svc.id)}
									class:disabled-row={!canSelectService(svc.status)}
									title={!canSelectService(svc.status) ? 'Only ended services can be selected' : ''}
									on:click={() => toggleRow(svc.id, svc.status)}
								>
									<td class="col-check" on:click|stopPropagation>
										<input
											type="checkbox"
											class="form-check-input"
											checked={selectedIds.has(svc.id)}
											disabled={!canSelectService(svc.status)}
											on:change={() => toggleRow(svc.id, svc.status)}
										/>
									</td>
									<td class="id-cell">#{svc.id}</td>
									<td class="name-cell">{svc.name ?? '—'}</td>
									<td>
										<span
											class="status-chip"
											style="background:{statusColor(svc.status)}22; color:{statusColor(
												svc.status
											)}; border:1px solid {statusColor(svc.status)}44;"
										>
											{statusLabel(svc.status)}
										</span>
									</td>
									<td>{utcToIstRelativeFormat(svc.starting_at)}</td>
									<td class="col-action" on:click|stopPropagation>
										<button
											class="end-btn"
											class:end-btn--disabled={svc.status !== 3}
											type="button"
											disabled={svc.status !== 3 || endingIds.has(svc.id)}
											title={getEndButtonTooltip(svc.status)}
											on:click={() => endService(svc.id)}
										>
											{#if endingIds.has(svc.id)}
												<span
													class="spinner-border spinner-border-sm"
													role="status"
													aria-hidden="true"
												></span>
											{:else}
												<i class="bi bi-stop-circle"></i>
											{/if}
											End
										</button>
									</td>
									<td class="col-action" on:click|stopPropagation>
										<button
											class="view-btn"
											type="button"
											aria-label="View service detail"
											on:click={() =>
												goto(
													`/company-services/detail?id=${svc.id}&from=report&from_date=${fromDate}&to_date=${toDate}`
												)}
										>
											<i class="bi bi-arrow-up-right-square"></i>
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	.main-div {
		background: var(--bg-primary);
		min-height: 100vh;
	}

	/* Top bar */
	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: nowrap;
		margin-bottom: 1.5rem;
	}
	.page-title-block {
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-width: 0;
	}
	.page-title {
		font-size: 1.4rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}
	.page-sub {
		font-size: 13px;
		color: var(--text-muted);
		margin: 4px 0 0;
	}

	/* Date filter */
	.date-filter-bar {
		display: flex;
		align-items: center;
		gap: 14px;
		flex-wrap: nowrap;
		margin-bottom: 1.5rem;
	}
	.date-cmp-wrap {
		display: flex;
	}

	/* Inner table scroll wrapper */
	.table-scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	/* Nudge FilterOnly down to align its select with date inputs */
	.date-filter-bar :global(.filter-only) {
		align-self: flex-end;
		margin-top: 2px;
	}
	/* State boxes */
	.state-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		min-height: 40vh;
		color: var(--text-muted);
		font-size: 14px;
	}
	.empty-icon {
		font-size: 40px;
	}
	.empty-title {
		font-size: 15px;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0;
	}
	.empty-sub {
		font-size: 13px;
		color: var(--text-muted);
		margin: 0;
	}

	/* Table */
	.table-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}
	.svc-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	.svc-table thead tr {
		background: var(--bg-primary);
		border-bottom: 1px solid var(--border);
	}
	.svc-table th {
		padding: 10px 14px;
		text-align: left;
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}
	.svc-table td {
		padding: 11px 14px;
		border-bottom: 1px solid var(--border);
		color: var(--text-primary);
		vertical-align: middle;
	}
	.svc-table tbody tr:last-child td {
		border-bottom: none;
	}
	.svc-table tbody tr {
		cursor: pointer;
		transition: background 0.12s;
	}
	.svc-table tbody tr:hover {
		background: var(--bg-primary);
	}
	.row-selected td {
		background: color-mix(in srgb, var(--edit-btn) 8%, transparent);
	}
	.col-check {
		width: 42px;
	}
	.col-action {
		width: 80px;
		text-align: center;
	}
	.id-cell {
		font-size: 12px;
		color: var(--text-muted);
	}
	.name-cell {
		font-weight: 500;
	}

	.end-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		height: 28px;
		padding: 0 10px;
		border-radius: 6px;
		border: 1px solid #dc354544;
		background: #dc354514;
		color: #dc3545;
		font-size: 11px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
		white-space: nowrap;
	}
	.end-btn:hover:not(:disabled) {
		background: #dc354522;
	}
	.end-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.end-btn--disabled {
		border-color: #6c757d44;
		background: #6c757d14;
		color: #6c757d;
		cursor: not-allowed;
		opacity: 0.6;
	}
	.end-btn--disabled:hover {
		background: #6c757d14;
	}
	.disabled-row {
		opacity: 0.65;
	}
	.disabled-row input[type='checkbox']:disabled {
		cursor: not-allowed;
	}

	.view-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--bg-primary);
		color: var(--edit-btn);
		font-size: 14px;
		cursor: pointer;
		transition: background 0.15s;
	}
	.view-btn:hover {
		background: color-mix(in srgb, var(--edit-btn) 10%, transparent);
	}

	.status-chip {
		display: inline-block;
		padding: 3px 10px;
		border-radius: 20px;
		font-size: 11px;
		font-weight: 600;
		white-space: nowrap;
	}

	.gen-btn {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		height: 38px;
		padding: 0 18px;
		border-radius: 10px;
		border: none;
		background: var(--edit-btn);
		color: #fff;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.gen-btn:hover {
		opacity: 0.9;
	}
	.gen-btn--top {
		height: 45px;
		padding: 0 16px;
		font-size: 12px;
		margin-left: auto;
		align-self: flex-end;
	}

	@media (max-width: 768px) {
		.top-bar {
			flex-direction: column;
			align-items: stretch;
		}
		.date-filter-bar {
			width: 100%;
			flex-wrap: wrap;
			gap: 10px;
		}
		.date-cmp-wrap {
			width: 100%;
			flex: 0 0 100%;
		}
		.date-filter-bar :global(.filter-only) {
			align-self: auto;
			margin-top: 0;
			flex: 1 1 auto;
		}
		.gen-btn--top {
			align-self: flex-end;
		}
		.page-wrapper {
			padding: 1.5rem;
		}
	}
</style>
