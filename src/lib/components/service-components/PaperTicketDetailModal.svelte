<script lang="ts">
	import { utcToIstFormat } from '$lib/helpers';

	export let ticket: {
		id: number;
		ticketSequenceId?: number;
		serviceId: number;
		dutyId: number;
		companyId: number;
		amount: string;
		createdOn: string;
		ticketTypes: Array<{ id: number; count: number; price: string; ticketTypeName?: string }>;
		pickupPointName: string;
		droppingPointName: string;
		distance: number;
	} | null = null;

	export let loading = false;
	export let onClose: () => void = () => {};

	function formatDistance(meters: number): string {
		if (!meters) return '—';
		if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
		return `${meters} m`;
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="modal-backdrop"
	role="dialog"
	aria-modal="true"
	aria-labelledby="ticket-modal-title"
	on:click|self={onClose}
	on:keydown={(e) => e.key === 'Escape' && onClose()}
	tabindex="-1"
>
	<div class="ticket-modal">
		<!-- Header -->
		<div class="modal-header-bar">
			<div class="header-left">
				<div class="ticket-icon-wrap">
					<i class="bi bi-ticket-perforated"></i>
				</div>
				<div>
					<h2 id="ticket-modal-title" class="modal-title-text">
						{#if ticket}Ticket T-{ticket.serviceId}-{ticket.ticketSequenceId ??
								ticket.id}{:else}Ticket Detail{/if}
					</h2>
					<p class="modal-subtitle">Paper ticket information</p>
				</div>
			</div>
			<button class="close-btn" on:click={onClose} aria-label="Close ticket detail">
				<i class="bi bi-x-lg"></i>
			</button>
		</div>

		<!-- Body -->
		<div class="modal-body-wrap">
			{#if loading}
				<div class="loading-state">
					<i class="bi bi-arrow-repeat spinner"></i>
					<span>Loading ticket details…</span>
				</div>
			{:else if !ticket}
				<div class="loading-state">
					<i class="bi bi-ticket-perforated-fill"></i>
					<span>No ticket data available</span>
				</div>
			{:else}
				<!-- Amount Banner -->
				<div class="amount-banner">
					<span class="amount-label">Total Amount</span>
					<span class="amount-value">₹{ticket.amount}</span>
				</div>

				<!-- Journey Info -->
				<div class="section-card">
					<p class="section-title">
						<i class="bi bi-map" style="color: #3b82f6;"></i>
						Journey
					</p>
					<div class="info-grid">
						<div class="info-item">
							<div class="info-icon-wrap" style="background: rgba(34,197,94,0.12);">
								<i class="bi bi-geo-alt-fill" style="color: #22c55e;"></i>
							</div>
							<div>
								<p class="info-label">PICKUP POINT</p>
								<p class="info-value">{ticket.pickupPointName}</p>
							</div>
						</div>
						<div class="info-item">
							<div class="info-icon-wrap" style="background: rgba(239,68,68,0.12);">
								<i class="bi bi-geo-alt-fill" style="color: #ef4444;"></i>
							</div>
							<div>
								<p class="info-label">DROPPING POINT</p>
								<p class="info-value">{ticket.droppingPointName}</p>
							</div>
						</div>
						<div class="info-item">
							<div class="info-icon-wrap" style="background: rgba(168,85,247,0.12);">
								<i class="bi bi-signpost-split" style="color: #a855f7;"></i>
							</div>
							<div>
								<p class="info-label">DISTANCE</p>
								<p class="info-value">{formatDistance(ticket.distance)}</p>
							</div>
						</div>
						<div class="info-item">
							<div class="info-icon-wrap" style="background: rgba(59,130,246,0.12);">
								<i class="bi bi-calendar3" style="color: #3b82f6;"></i>
							</div>
							<div>
								<p class="info-label">ISSUED AT</p>
								<p class="info-value">{utcToIstFormat(ticket.createdOn)}</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Ticket Types / Fare Breakdown -->
				{#if ticket.ticketTypes.length > 0}
					<div class="section-card">
						<p class="section-title">
							<i class="bi bi-receipt" style="color: #f97316;"></i>
							Fare Breakdown
						</p>
						<div class="fare-table-wrap">
							<table class="fare-table">
								<thead>
									<tr>
										<th>Fare</th>
										<th class="text-center">Count</th>
										<th class="text-right">Unit Price</th>
										<th class="text-right">Subtotal</th>
									</tr>
								</thead>
								<tbody>
									{#each ticket.ticketTypes as tt}
										<tr>
											<td class="fare-name">{tt.ticketTypeName ?? `Type #${tt.id}`}</td>
											<td class="text-center">
												<span class="count-badge">{tt.count}</span>
											</td>
											<td class="text-right">₹{tt.price}</td>
											<td class="text-right fw-semibold">
												₹{(parseFloat(tt.price) * tt.count).toFixed(2)}
											</td>
										</tr>
									{/each}
								</tbody>
								<tfoot>
									<tr>
										<td colspan="3" class="total-label">Total</td>
										<td class="text-right total-value">₹{ticket.amount}</td>
									</tr>
								</tfoot>
							</table>
						</div>
					</div>
				{/if}

				<!-- IDs Section -->
				<div class="section-card">
					<p class="section-title">
						<i class="bi bi-hash" style="color: #a56bfd;"></i>
						References
					</p>
					<div class="refs-row">
						<div class="ref-chip">
							<span class="ref-label">Ticket ID</span>
							<span class="ref-val"
								>T-{ticket.serviceId}-{ticket.ticketSequenceId ?? ticket.id}</span
							>
						</div>
						<div class="ref-chip">
							<span class="ref-label">ID</span>
							<span class="ref-val">#{ticket.id}</span>
						</div>
						<div class="ref-chip">
							<span class="ref-label">Duty ID</span>
							<span class="ref-val">#{ticket.dutyId}</span>
						</div>
						<div class="ref-chip">
							<span class="ref-label">Service ID</span>
							<span class="ref-val">#{ticket.serviceId}</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		backdrop-filter: blur(2px);
	}

	.ticket-modal {
		background: var(--bg-card);
		border-radius: 20px;
		width: 100%;
		max-width: 540px;
		max-height: 88vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
		border: 1px solid var(--border);
	}

	/* Header */
	.modal-header-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px 16px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.ticket-icon-wrap {
		width: 42px;
		height: 42px;
		border-radius: 12px;
		background: rgba(59, 130, 246, 0.12);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
		color: #3b82f6;
		flex-shrink: 0;
	}

	.modal-title-text {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.modal-subtitle {
		font-size: 11px;
		color: var(--text-muted);
		margin: 2px 0 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.close-btn {
		background: none;
		border: none;
		padding: 8px;
		border-radius: 8px;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 14px;
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.close-btn:hover {
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	/* Body */
	.modal-body-wrap {
		overflow-y: auto;
		padding: 20px 24px 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		scrollbar-width: none;
	}

	.modal-body-wrap::-webkit-scrollbar {
		display: none;
	}

	/* Loading */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 48px 0;
		color: var(--text-muted);
		font-size: 14px;
	}

	.loading-state i {
		font-size: 28px;
	}

	/* Amount Banner */
	.amount-banner {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(168, 85, 247, 0.1));
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 14px;
		padding: 18px 22px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.amount-label {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.amount-value {
		font-size: 28px;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	/* Section Cards */
	.section-card {
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 16px;
	}

	.section-title {
		font-size: 11px;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.07em;
		margin: 0 0 14px;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	/* Info Grid */
	.info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.info-item {
		display: flex;
		align-items: flex-start;
		gap: 10px;
	}

	.info-icon-wrap {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.info-label {
		font-size: 10px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 3px;
	}

	.info-value {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		word-break: break-word;
	}

	/* Fare Table */
	.fare-table-wrap {
		overflow-x: auto;
	}

	.fare-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	.fare-table thead tr {
		border-bottom: 1px solid var(--border);
	}

	.fare-table th {
		padding: 8px 10px;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.fare-table td {
		padding: 10px 10px;
		color: var(--text-primary);
		border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
	}

	.fare-table tbody tr:last-child td {
		border-bottom: none;
	}

	.fare-table tfoot tr {
		border-top: 2px solid var(--border);
	}

	.text-center {
		text-align: center;
	}

	.text-right {
		text-align: right;
	}

	.fare-name {
		font-weight: 500;
	}

	.count-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 22px;
		height: 22px;
		padding: 0 6px;
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 700;
	}

	.total-label {
		font-weight: 700;
		color: var(--text-muted);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.total-value {
		font-weight: 800;
		font-size: 15px;
		color: var(--text-primary);
	}

	/* References */
	.refs-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.ref-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 6px 12px;
	}

	.ref-label {
		font-size: 11px;
		color: var(--text-muted);
		font-weight: 500;
	}

	.ref-val {
		font-size: 12px;
		color: var(--text-primary);
		font-weight: 700;
	}

	/* Spinner */
	.spinner {
		animation: spin 0.9s linear infinite;
		display: inline-block;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 520px) {
		.ticket-modal {
			max-height: 95vh;
			border-radius: 14px;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}

		.amount-value {
			font-size: 22px;
		}
	}
</style>
