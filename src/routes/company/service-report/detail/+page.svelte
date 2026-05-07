<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import { fetchServiceList } from '$lib/services/company-services';
	import { fetchDutyList } from '$lib/services/service-duty';
	import { fetchOperatorAccount } from '$lib/services/operator-account';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { SERVICE_STATUS_LABEL_BY_VALUE } from '$lib/constants';
	import { onMount } from 'svelte';

	//-- URL params --
	const searchParams = $page.url.searchParams;
	const rawIds = searchParams.get('ids') ?? '';
	const fromDate = searchParams.get('from') ?? '';
	const toDate = searchParams.get('to') ?? '';

	const serviceIds: number[] = rawIds
		.split(',')
		.map((s) => parseInt(s.trim(), 10))
		.filter((n) => !isNaN(n));

	//-- State --
	interface ReportRow {
		id: number;
		name: string;
		registration_number: string;
		status: number;
		ticket_mode: number;
		vehicle_name: string;
		starting_at: string;
		ending_at: string;
		total_collection: number;
		duty_count: number;
	}

	let rows: ReportRow[] = [];
	let loading = true;
	let generatedAt = '';

	//-- Helpers --
	function statusLabel(status: number): string {
		return (SERVICE_STATUS_LABEL_BY_VALUE as Record<number, string>)[status] ?? String(status);
	}

	function statusColor(status: number): string {
		const map: Record<number, string> = {
			1: '#6c757d',
			2: '#0d6efd',
			3: '#198754',
			4: '#dc3545',
			5: '#6f42c1'
		};
		return map[status] ?? '#6c757d';
	}

	function ticketModeLabel(mode: number): string {
		const map: Record<number, string> = { 1: 'Hybrid', 2: 'Digital', 3: 'Conventional' };
		return map[mode] ?? String(mode);
	}

	function formatDate(iso: string | null | undefined): string {
		if (!iso) return '—';
		const d = new Date(iso);
		if (isNaN(d.getTime())) return iso ?? '—';
		return new Intl.DateTimeFormat('en-IN', {
			timeZone: 'Asia/Kolkata',
			year: 'numeric',
			month: 'short',
			day: '2-digit'
		}).format(d);
	}

	function formatDateTime(iso: string | null | undefined): string {
		if (!iso) return '—';
		const d = new Date(iso);
		if (isNaN(d.getTime())) return iso ?? '—';
		return new Intl.DateTimeFormat('en-IN', {
			timeZone: 'Asia/Kolkata',
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).format(d);
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 2
		}).format(amount);
	}

	function formatDisplayDate(date: string): string {
		if (!date) return '—';
		const d = new Date(`${date}T00:00:00+05:30`);
		return new Intl.DateTimeFormat('en-IN', {
			timeZone: 'Asia/Kolkata',
			year: 'numeric',
			month: 'long',
			day: '2-digit'
		}).format(d);
	}

	//-- Operator-wise breakdown --
	interface OperatorRow {
		operator_id: number;
		name: string;
		duty_count: number;
		total_collection: number;
	}
	let operatorRows: OperatorRow[] = [];

	$: grandTotal = rows.reduce((sum, r) => sum + r.total_collection, 0);
	$: totalDuties = rows.reduce((sum, r) => sum + r.duty_count, 0);

	//-- Paginated fetchers (API max is 100) --
	async function fetchAllServices(ids: number[]) {
		const PAGE = 100;
		let offset = 0;
		let all: any[] = [];
		while (true) {
			const page = await fetchServiceList({ id_list: ids, limit: PAGE, offset });
			const results = Array.isArray(page) ? page : [];
			all = [...all, ...results];
			if (results.length < PAGE) break;
			offset += PAGE;
		}
		return all;
	}

	async function fetchAllDuties(service_id: number) {
		const PAGE = 100;
		let offset = 0;
		let all: any[] = [];
		while (true) {
			const page = await fetchDutyList({ service_id, limit: PAGE, offset });
			const results = Array.isArray(page) ? page : [];
			all = [...all, ...results];
			if (results.length < PAGE) break;
			offset += PAGE;
		}
		return all;
	}

	//-- Load data --
	async function loadReport() {
		if (serviceIds.length === 0) {
			toast.error('No service IDs provided.');
			loading = false;
			return;
		}
		try {
			//-- Fetch services by id_list --
			const services = await fetchAllServices(serviceIds);

			//-- Fetch duties for each service in parallel --
			const dutiesPerService = await Promise.all(serviceIds.map((sid) => fetchAllDuties(sid)));

			//-- Build report rows --
			rows = serviceIds
				.map((sid, idx) => {
					const svc = Array.isArray(services) ? services.find((s: any) => s.id === sid) : null;
					if (!svc) return null;

					const duties = dutiesPerService[idx] ?? [];
					const total = duties.reduce((sum, d) => {
						const val = parseFloat(d.collection ?? '0');
						return sum + (isNaN(val) ? 0 : val);
					}, 0);

					return {
						id: svc.id,
						name: svc.name ?? '—',
						registration_number: svc.registration_number ?? '—',
						status: svc.status,
						ticket_mode: svc.ticket_mode,
						vehicle_name: (svc as any).vehicle?.name ?? '—',
						starting_at: svc.starting_at,
						ending_at: svc.ending_at,
						total_collection: total,
						duty_count: duties.length
					} satisfies ReportRow;
				})
				.filter((r): r is ReportRow => r !== null);

			//-- Build operator-wise breakdown from all duties --
			const allDuties = dutiesPerService.flat();
			const opMap = new Map<number, { duty_count: number; total_collection: number }>();
			for (const d of allDuties) {
				if (d.operator_id == null) continue;
				const val = parseFloat(d.collection ?? '0');
				const existing = opMap.get(d.operator_id);
				if (existing) {
					existing.duty_count += 1;
					existing.total_collection += isNaN(val) ? 0 : val;
				} else {
					opMap.set(d.operator_id, { duty_count: 1, total_collection: isNaN(val) ? 0 : val });
				}
			}

			//-- Fetch operator names for all unique operator IDs --
			const opIds = [...opMap.keys()];
			let opNameMap = new Map<number, string>();
			if (opIds.length > 0) {
				try {
					const operators = await fetchOperatorAccount({ id_list: opIds, limit: 100 });
					if (Array.isArray(operators)) {
						for (const op of operators) {
							opNameMap.set(op.id, op.full_name ?? op.username ?? `Operator #${op.id}`);
						}
					}
				} catch {
					// names unavailable — fall back to ID display
				}
			}

			operatorRows = opIds
				.map((oid) => ({
					operator_id: oid,
					name: opNameMap.get(oid) ?? `Operator #${oid}`,
					...opMap.get(oid)!
				}))
				.sort((a, b) => b.total_collection - a.total_collection);

			generatedAt = new Intl.DateTimeFormat('en-IN', {
				timeZone: 'Asia/Kolkata',
				year: 'numeric',
				month: 'short',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
			}).format(new Date());
		} catch (err: any) {
			const msg = await handleApiError(err);
			toast.error(msg || 'Failed to load report data.');
		} finally {
			loading = false;
		}
	}

	onMount(loadReport);

	function handleBack() {
		goto('/company/service-report');
	}

	function handlePrint() {
		window.print();
	}
</script>

<div class="main-div d-flex flex-column min-vh-100">
	<div class="sticky-top no-print">
		<HeaderBar />
	</div>

	<main class="container-xl py-4 page-wrapper">
		<!-- Toolbar (hidden on print) -->
		<div class="toolbar no-print">
			<button class="back-btn" type="button" on:click={handleBack}>
				<i class="bi bi-arrow-left"></i>
				Back
			</button>
			{#if !loading && rows.length > 0}
				<button class="print-btn" type="button" on:click={handlePrint}>
					<i class="bi bi-download"></i>
					Download PDF
				</button>
			{/if}
		</div>

		{#if loading}
			<div class="state-box">
				<div class="spinner-border text-primary" role="status" style="width:2.5rem;height:2.5rem;">
					<span class="visually-hidden">Loading…</span>
				</div>
				<p>Generating report…</p>
			</div>
		{:else if rows.length === 0}
			<div class="state-box">
				<i class="bi bi-inbox empty-icon"></i>
				<p class="empty-title">No data available for the selected criteria</p>
				<p class="empty-sub">The selected services could not be found or have no data.</p>
			</div>
		{:else}
			<!-- Report document -->
			<div class="report-doc" id="report-content">
				<!-- Report header -->
				<div class="report-header">
					<div class="report-title-block">
						<h1 class="report-title">Service Collection Report</h1>
						<p class="report-subtitle">Operator Service Report</p>
					</div>
					<div class="report-meta">
						<div class="meta-row">
							<span class="meta-label">Period</span>
							<span class="meta-value"
								>{formatDisplayDate(fromDate)} — {formatDisplayDate(toDate)}</span
							>
						</div>
						<div class="meta-row">
							<span class="meta-label">Services</span>
							<span class="meta-value">{rows.length}</span>
						</div>
						<div class="meta-row">
							<span class="meta-label">Generated</span>
							<span class="meta-value">{generatedAt}</span>
						</div>
					</div>
				</div>

				<div class="report-divider"></div>

				<!-- Service-wise breakdown (full width) -->
				<div class="table-section">
					<h2 class="section-title">Service-wise Breakdown</h2>
					<div class="report-table-wrap">
						<table class="report-table">
							<thead>
								<tr>
									<th>#</th>
									<th>ID</th>
									<th>Service Name</th>
									<th>Reg. No.</th>
									<th>Status</th>
									<th>Mode</th>
									<th>Starting Date</th>
									<th>Ending Date</th>
									<th class="col-duties">Duties</th>
									<th class="col-amount">Collection (₹)</th>
								</tr>
							</thead>
							<tbody>
								{#each rows as row, i (row.id)}
									<tr>
										<td class="cell-num">{i + 1}</td>
										<td class="cell-id">#{row.id}</td>
										<td class="cell-name">{row.name}</td>
										<td class="cell-reg">{row.registration_number}</td>
										<td>
											<span
												class="status-chip"
												style="background:{statusColor(row.status)}1a; color:{statusColor(
													row.status
												)}; border:1px solid {statusColor(row.status)}44;"
											>
												{statusLabel(row.status)}
											</span>
										</td>
										<td class="cell-mode">{ticketModeLabel(row.ticket_mode)}</td>
										<td class="cell-date">{formatDateTime(row.starting_at)}</td>
										<td class="cell-date">{formatDateTime(row.ending_at)}</td>
										<td class="cell-duties">{row.duty_count}</td>
										<td class="cell-amount">
											{row.total_collection > 0
												? formatCurrency(row.total_collection)
												: row.duty_count === 0
													? '—'
													: formatCurrency(0)}
										</td>
									</tr>
								{/each}
							</tbody>
							<tfoot>
								<tr class="total-row">
									<td colspan="8" class="total-label">Total</td>
									<td class="cell-duties">{totalDuties}</td>
									<td class="cell-amount total-amount">{formatCurrency(grandTotal)}</td>
								</tr>
							</tfoot>
						</table>
					</div>
				</div>

				{#if operatorRows.length > 0}
					<!-- Bottom row: operator table + summary info panel side by side -->
					<div class="tables-row">
						<!-- Operator-wise breakdown -->
						<div class="table-section table-section--operator">
							<h2 class="section-title">Operator-wise Collection</h2>
							<div class="report-table-wrap">
								<table class="report-table">
									<thead>
										<tr>
											<th>#</th>
											<th>Operator</th>
											<th class="col-duties">Duties</th>
											<th class="col-amount">Collection (₹)</th>
										</tr>
									</thead>
									<tbody>
										{#each operatorRows as op, i (op.operator_id)}
											<tr>
												<td class="cell-num">{i + 1}</td>
												<td>
													<p class="op-name">{op.name}</p>
													<p class="op-id">ID #{op.operator_id}</p>
												</td>
												<td class="cell-duties">{op.duty_count}</td>
												<td class="cell-amount">{formatCurrency(op.total_collection)}</td>
											</tr>
										{/each}
									</tbody>
									<tfoot>
										<tr class="total-row">
											<td colspan="2" class="total-label">Total</td>
											<td class="cell-duties"
												>{operatorRows.reduce((s, r) => s + r.duty_count, 0)}</td
											>
											<td class="cell-amount total-amount"
												>{formatCurrency(
													operatorRows.reduce((s, r) => s + r.total_collection, 0)
												)}</td
											>
										</tr>
									</tfoot>
								</table>
							</div>
						</div>

						<!-- Summary info panel (fills remaining space) -->
						<div class="summary-side">
							<div class="summary-card highlight">
								<p class="sum-label">Grand Collection</p>
								<p class="sum-value">{formatCurrency(grandTotal)}</p>
							</div>
							<div class="summary-card">
								<p class="sum-label">Total Duties</p>
								<p class="sum-value">{totalDuties}</p>
							</div>
							<div class="summary-card">
								<p class="sum-label">Total Services</p>
								<p class="sum-value">{rows.length}</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Report footer -->
				<div class="report-footer">
					<p>This is a system-generated report. No signature required.</p>
					<p>Generated on {generatedAt} (IST)</p>
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

	/* Toolbar */
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 36px;
		padding: 0 14px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-card);
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}
	.back-btn:hover {
		background: var(--bg-primary);
	}

	.print-btn {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		height: 36px;
		padding: 0 16px;
		border-radius: 8px;
		border: none;
		background: var(--edit-btn);
		color: #fff;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.print-btn:hover {
		opacity: 0.9;
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

	/* Report document */
	.report-doc {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 2rem 2.5rem;
		max-width: 100%;
	}

	/* Report header */
	.report-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.25rem;
	}
	.report-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}
	.report-subtitle {
		font-size: 13px;
		color: var(--text-muted);
		margin: 4px 0 0;
	}
	.report-meta {
		display: flex;
		flex-direction: column;
		gap: 5px;
		text-align: right;
	}
	.meta-row {
		display: flex;
		align-items: center;
		gap: 8px;
		justify-content: flex-end;
	}
	.meta-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.meta-value {
		font-size: 13px;
		color: var(--text-primary);
		font-weight: 500;
	}

	.report-divider {
		height: 1px;
		background: var(--border);
		margin-bottom: 1.5rem;
	}

	/* Summary cards */
	.summary-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		margin-bottom: 2rem;
	}
	.summary-card {
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 1rem 1.25rem;
	}
	.summary-card.highlight {
		background: color-mix(in srgb, var(--edit-btn) 8%, transparent);
		border-color: color-mix(in srgb, var(--edit-btn) 30%, transparent);
	}
	.sum-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 6px;
	}
	.sum-value {
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}
	.summary-card.highlight .sum-value {
		color: var(--edit-btn);
	}

	/* Tables row layout (operator table + summary side panel) */
	.tables-row {
		display: flex;
		align-items: flex-start;
		gap: 20px;
		margin-top: 1.75rem;
		margin-bottom: 2rem;
	}
	.table-section {
		margin-bottom: 1.75rem;
	}
	.table-section--operator {
		flex: 1 1 0;
		min-width: 0;
	}
	.summary-side {
		flex: 1 1 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-top: 30px; /* align with table body, past section-title */
	}
	.section-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 12px;
	}
	.op-name {
		margin: 0;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-primary);
	}
	.op-id {
		margin: 2px 0 0;
		font-size: 11px;
		color: var(--text-muted);
	}
	.report-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	.report-table thead tr {
		background: var(--bg-primary);
		border-bottom: 1px solid var(--border);
	}
	.report-table th {
		padding: 10px 12px;
		text-align: left;
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}
	.report-table td {
		padding: 11px 12px;
		border-bottom: 1px solid var(--border);
		color: var(--text-primary);
		vertical-align: middle;
	}
	.report-table tbody tr:last-child td {
		border-bottom: none;
	}
	.report-table tbody tr:hover {
		background: var(--bg-primary);
	}
	.report-table tfoot .total-row td {
		background: var(--bg-primary);
		font-weight: 700;
		font-size: 13px;
		border-top: 2px solid var(--border);
		color: var(--text-primary);
	}
	.total-label {
		text-align: right;
		padding-right: 16px !important;
		font-size: 12px !important;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.total-amount {
		color: var(--edit-btn) !important;
		font-size: 14px !important;
	}

	.cell-num,
	.cell-id {
		font-size: 12px;
		color: var(--text-muted);
	}
	.cell-name {
		font-weight: 500;
		min-width: 140px;
	}
	.cell-reg {
		font-family: monospace;
		font-size: 12px;
	}
	.cell-mode {
		font-size: 12px;
		color: var(--text-muted);
	}
	.cell-date {
		font-size: 12px;
		white-space: nowrap;
	}
	.cell-duties {
		text-align: center;
	}
	.col-duties,
	.col-amount {
		text-align: center;
	}
	.cell-amount {
		text-align: right;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.status-chip {
		display: inline-block;
		padding: 3px 10px;
		border-radius: 20px;
		font-size: 11px;
		font-weight: 600;
		white-space: nowrap;
	}

	/* Report footer */
	.report-footer {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
		text-align: center;
		font-size: 11px;
		color: var(--text-muted);
		line-height: 1.6;
	}
	.report-footer p {
		margin: 0;
	}

	/* Print styles */
	@media print {
		.no-print {
			display: none !important;
		}

		.main-div {
			background: #fff;
		}

		.report-doc {
			border: none;
			border-radius: 0;
			padding: 0;
			box-shadow: none;
		}

		.tables-row {
			flex-direction: column;
		}
		.summary-side {
			flex-direction: row;
			flex-wrap: wrap;
			padding-top: 0;
		}
		.summary-side .summary-card {
			flex: 1 1 140px;
		}

		.summary-card,
		.report-table-wrap {
			border-color: #ccc;
		}

		.report-table thead tr,
		.report-table tfoot .total-row td {
			background: #f5f5f5 !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		.status-chip {
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		.summary-card.highlight {
			background: #f0f4ff !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		@page {
			size: A4 portrait;
			margin: 1.5cm;
		}
	}

	@media (max-width: 768px) {
		.report-doc {
			padding: 1.25rem;
		}
		.report-header {
			flex-direction: column;
		}
		.report-meta {
			text-align: left;
		}
		.meta-row {
			justify-content: flex-start;
		}
		.summary-grid {
			grid-template-columns: 1fr 1fr;
		}
		.summary-grid .summary-card:last-child {
			grid-column: span 2;
		}
		.tables-row {
			flex-direction: column;
		}
		.summary-side {
			flex-direction: row;
			flex-wrap: wrap;
			padding-top: 0;
		}
		.summary-side .summary-card {
			flex: 1 1 140px;
		}
	}
</style>
