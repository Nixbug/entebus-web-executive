<script lang="ts">
	//-- timelineStop.svelte
	import type { ServiceRouteStop } from '$lib/types/type';
	import { formatDistance as formatDistanceValue, utcToIstFormat } from '$lib/helpers';

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

	function formatDistance(m: number | null): string {
		if (m == null) return '';
		return formatDistanceValue(m);
	}
</script>

<div class="stop">
	<!-- Dot + connector column -->
	<div class="dot-col">
		<div
			class="dot"
			class:dot-first={type === 'first'}
			class:dot-last={type === 'last'}
			class:dot-mid={type === 'mid'}
		></div>
		{#if type !== 'last'}
			<div class="connector"></div>
		{/if}
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
				<div class="dist-pill">
					<svg
						viewBox="0 0 12 12"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						width="10"
						height="10"
					>
						<circle cx="2" cy="6" r="1.5" /><circle cx="10" cy="6" r="1.5" /><path d="M3.5 6h5" />
					</svg>
					{formatDistance(stop.distanceFromStart)} from start
				</div>
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

		{#if type !== 'last' && segmentDistance != null}
			<div class="segment">
				<div class="seg-line"></div>
				<span class="seg-text">{formatDistance(segmentDistance)}</span>
				<div class="seg-line"></div>
			</div>
		{/if}
	</div>
</div>

<style>
	.stop {
		display: flex;
		gap: 0;
	}

	/* ── Dot column ── */
	.dot-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-left: -26px;
		width: 26px;
		flex-shrink: 0;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid var(--border);
		background: var(--bg-card);
		margin-top: 3px;
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

	.connector {
		width: 2px;
		flex: 1;
		background: var(--border);
		min-height: 36px;
	}

	/* ── Content column ── */
	.content {
		flex: 1;
		min-width: 0;
		padding-left: 10px;
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

	.dist-pill {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		color: var(--text-muted);
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 1px 7px;
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

	/* ── Segment row between stops ── */
	.segment {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 4px;
		height: 26px;
	}

	.seg-line {
		flex: 1;
		height: 1px;
		background: var(--border);
	}

	.seg-text {
		font-size: 11px;
		color: var(--text-muted);
		white-space: nowrap;
	}
</style>
