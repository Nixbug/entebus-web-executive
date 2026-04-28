<script lang="ts">
	//-- timelineStop.svelte
	import type { ServiceRouteStop } from '$lib/types/type';
	import { utcToIstFormat } from '$lib/helpers';

	type FareDisplayItem = {
		ticketType: string;
		amount: string;
	};

	export let stop: ServiceRouteStop;
	export let landmarkName: string = '';
	export let type: 'first' | 'mid' | 'last' = 'mid';
	export let segmentDistance: number | null = null;
	export let fares: FareDisplayItem[] = [];

	$: arrivalTime = formatIst(stop?.arrivalAt);
	$: departureTime = formatIst(stop?.departureAt);

	function formatIst(iso: string | null | undefined): string {
		return utcToIstFormat(iso) || '—';
	}

	function formatDistanceKm(m: number | null): string {
		if (m == null) return '';
		const km = m / 1000;
		const formatted = Number.isInteger(km) ? String(km) : km.toFixed(1).replace(/\.0$/, '');
		return `${formatted} km`;
	}
</script>

<div class="stop" class:stop-last={type === 'last'}>
	<!-- Dot + connector column -->
	<div class="dot-col">
		<div class="dot-stack">
			<div class="rail-line" class:rail-hidden={type === 'first'}></div>
			<div class="dot-marker">
				<div
					class="dot"
					class:dot-first={type === 'first'}
					class:dot-last={type === 'last'}
					class:dot-mid={type === 'mid'}
				></div>
			</div>
			<div class="rail-line" class:rail-hidden={type === 'last'}></div>
		</div>
	</div>

	<!-- Content column -->
	<div class="content">
		<span
			class="point-label"
			class:point-start={type === 'first'}
			class:point-end={type === 'last'}
			class:point-stop={type === 'mid'}
		>
			{type === 'first' ? 'Start' : type === 'last' ? 'Destination' : 'Stop'}
		</span>
		<span class="point-line"></span>
		<div class="card">
			<div class="card-header">
				<span class="landmark-name">{landmarkName}</span>
				<span class="landmark-id">#{stop.landmarkId}</span>
			</div>

			<div class="card-meta">
				{#if type !== 'first'}
					<div class="meta-item">
						<i class="bi bi-arrow-down-short arrival-icon"></i>
						{arrivalTime}
					</div>
				{/if}
				{#if type !== 'last'}
					<div class="meta-item">
						<i class="bi bi-arrow-up-short departure-icon"></i>
						{departureTime}
					</div>
				{/if}
			</div>

			{#if fares.length}
				<div class="fare-section">
					<p class="fare-label">Fare from start</p>
					<div class="fare-list">
						{#each fares as fare (fare.ticketType)}
							<span class="fare-chip">
								<span class="fare-type">{fare.ticketType}</span>
								<span class="fare-amount">{fare.amount}</span>
							</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if type !== 'last'}
		<div class="segment-col">
			<div class="connector">
				{#if segmentDistance != null}
					<span class="rail-distance">{formatDistanceKm(segmentDistance)}</span>
				{/if}
			</div>
		</div>
		<div class="segment-gap"></div>
	{/if}
</div>

<style>
	.stop {
		display: grid;
		grid-template-columns: 28px minmax(0, 1fr);
		grid-template-rows: auto 30px;
		column-gap: 56px;
	}

	.stop-last {
		grid-template-rows: auto;
	}

	/* ── Rail column ── */
	.dot-col {
		display: flex;
		justify-content: center;
		grid-column: 1;
		grid-row: 1;
		min-height: 100%;
	}

	.dot-stack {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		height: 100%;
		min-height: 56px;
	}

	.rail-line {
		width: 2px;
		flex: 1;
		background: var(--border);
	}

	.rail-hidden {
		visibility: hidden;
	}

	.dot-marker {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid var(--border);
		background: var(--bg-card);
		position: relative;
		z-index: 2;
		flex-shrink: 0;
	}

	/* accent colors for start/end dots — intentionally fixed, not theme-dependent */
	.dot-first {
		background: #1d9e75;
		border-color: #1d9e75;
	}
	.dot-last {
		background: #d85a30;
		border-color: #d85a30;
	}
	.dot-mid {
		background: var(--bg-card);
		border-color: #378add;
	}

	/* ── Content column ── */
	.content {
		grid-column: 2;
		grid-row: 1;
		min-width: 0;
		position: relative;
	}

	.point-line {
		position: absolute;
		top: 50%;
		left: -56px;
		width: 56px;
		height: 1px;
		background: var(--border);
		transform: translateY(-50%);
	}

	.point-label {
		position: absolute;
		top: calc(50% - 18px);
		left: -56px;
		font-size: 9px;
		font-weight: 600;
		line-height: 1;
		white-space: nowrap;
	}

	.point-start {
		color: #0f6e56;
	}

	.point-end {
		color: #993c1d;
	}

	.point-stop {
		color: #185fa5;
	}

	/* ── Card ── */
	.card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 10px 12px;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 7px;
		margin-bottom: 7px;
		flex-wrap: wrap;
	}

	.landmark-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-primary);
		text-transform: capitalize;
	}

	.landmark-id {
		font-size: 11px;
		color: var(--text-muted);
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 1px 6px;
	}

	.card-meta {
		display: flex;
		gap: 9px;
		flex-wrap: wrap;
		align-items: center;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 3px;
		font-size: 12px;
		color: var(--text-muted);
	}

	.arrival-icon,
	.departure-icon {
		font-size: 16px;
		line-height: 1;
	}

	.arrival-icon {
		color: #0f6e56;
	}

	.departure-icon {
		color: #d85a30;
	}

	.fare-section {
		margin-top: 4px;
		padding-top: 6px;
		border-top: 1px solid var(--border);
	}

	.fare-label {
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 6px;
	}

	.fare-list {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.fare-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: var(--text-primary);
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 2px 6px;
		max-width: 100%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.fare-type {
		color: var(--text-muted);
		font-size: 11px;
		max-width: 60%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.fare-amount {
		font-weight: 600;
		flex-shrink: 0;
	}

	@media (max-width: 420px) {
		.fare-list {
			gap: 4px;
		}
		.fare-chip {
			font-size: 10px;
			padding: 1px 6px;
			gap: 4px;
			border-radius: 8px;
		}
		.fare-label {
			font-size: 10px;
			margin-bottom: 4px;
		}
	}

	/* ── Segment rail between stops ── */
	.segment-col {
		grid-column: 1;
		grid-row: 2;
		display: flex;
		justify-content: center;
		min-height: 30px;
	}

	.connector {
		position: relative;
		width: 2px;
		height: 100%;
		background: var(--border);
	}

	.rail-distance {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 10px;
		font-weight: 600;
		color: var(--text-muted);
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 1px 5px;
		white-space: nowrap;
		z-index: 2;
	}

	.segment-gap {
		grid-column: 2;
		grid-row: 2;
		min-height: 30px;
	}
</style>
