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
			<div
				class="dot"
				class:dot-first={type === 'first'}
				class:dot-last={type === 'last'}
				class:dot-mid={type === 'mid'}
			></div>
			<div class="rail-line" class:rail-hidden={type === 'last'}></div>
		</div>
	</div>

	<!-- Content column -->
	<div class="content">
		<div class="card">
			<div class="card-header">
				<span class="landmark-name">{landmarkName}</span>
				<span class="landmark-id">#{stop.landmarkId}</span>
				<span
					class="badge"
					class:badge-start={type === 'first'}
					class:badge-end={type === 'last'}
					class:badge-stop={type === 'mid'}
				>
					{type === 'first' ? 'Origin' : type === 'last' ? 'Destination' : 'Stop'}
				</span>
			</div>

			<div class="card-meta">
				{#if type !== 'first'}
					<div class="meta-item">
						<svg
							viewBox="0 0 12 12"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							width="12"
							height="12"
						>
							<circle cx="6" cy="6" r="5" /><path d="M6 3v3l2 1.5" />
						</svg>
						Arr: {arrivalTime}
					</div>
				{/if}
				{#if type !== 'last'}
					<div class="meta-item">
						<svg
							viewBox="0 0 12 12"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							width="12"
							height="12"
						>
							<circle cx="6" cy="6" r="5" /><path d="M6 3v3l2 1.5" />
						</svg>
						Dep: {departureTime}
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
		grid-template-columns: 56px minmax(0, 1fr);
		grid-template-rows: auto 30px;
		column-gap: 10px;
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

	.badge {
		font-size: 11px;
		font-weight: 500;
		padding: 1px 7px;
		border-radius: 10px;
		margin-left: auto;
	}

	/* badge colors are semantic accents — kept fixed across modes */
	.badge-start {
		background: #e1f5ee;
		color: #0f6e56;
	}
	.badge-end {
		background: #faece7;
		color: #993c1d;
	}
	.badge-stop {
		background: #e6f1fb;
		color: #185fa5;
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
		gap: 4px;
		font-size: 12px;
		color: var(--text-muted);
	}

	.fare-section {
		margin-top: 8px;
		padding-top: 8px;
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
		padding: 2px 7px;
	}

	.fare-type {
		color: var(--text-muted);
	}

	.fare-amount {
		font-weight: 600;
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
