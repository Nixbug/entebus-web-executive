<script lang="ts">
	// Import must match the actual filename on disk exactly: TimeLineStop.svelte
	import TimeLineStop from '$lib/components/service-components/TimeLineStop.svelte';
	import type { ServiceRouteStop, LandmarkMap, Landmark } from '$lib/types/type';

	export let route: ServiceRouteStop[] = [];
	export let landmarkMap: LandmarkMap = {};

	type StopWithMeta = ServiceRouteStop & {
		type: 'first' | 'mid' | 'last';
		segmentDistance: number | null;
		landmark: Landmark | undefined;
	};

	$: stopsWithSegment = route.map((stop, i): StopWithMeta => {
		const next = route[i + 1];
		const segmentDistance = next ? next.distanceFromStart - stop.distanceFromStart : null;
		const type: 'first' | 'mid' | 'last' =
			i === 0 ? 'first' : i === route.length - 1 ? 'last' : 'mid';
		const landmark = landmarkMap[stop.landmarkId];
		return { ...stop, type, segmentDistance, landmark };
	});

	$: totalDistance = route.length ? route[route.length - 1].distanceFromStart : 0;

	$: dateLabel = route.length
		? new Date(route[0].departureAt).toLocaleDateString('en-IN', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})
		: '';

	function formatDistance(m: number | null): string {
		if (m == null) return '';
		return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
	}
</script>

<main class="timeline-panel">
	<div class="top-bar">
		<h2 class="panel-title">Route timeline</h2>
		<div class="actions">
			<button class="btn">Edit service</button>
			<button class="btn btn-danger">Cancel</button>
		</div>
	</div>

	<p class="section-meta">
		{dateLabel} · {route.length} stops · {formatDistance(totalDistance)} total
	</p>

	<div class="timeline">
		{#each stopsWithSegment as stop, i (stop.landmarkId + '-' + i)}
			<TimeLineStop
				stop={stop}
				landmarkName={stop.landmark?.name ?? `Landmark #${stop.landmarkId}`}
				type={stop.type}
				segmentDistance={stop.segmentDistance}
			/>
		{/each}
	</div>
</main>

<style>
	.timeline-panel {
		padding: 24px 28px;
		overflow-y: auto;
	}

	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 6px;
	}

	.panel-title {
		font-size: 16px;
		font-weight: 500;
		color: var(--color-text, #111);
	}

	.actions { display: flex; gap: 8px; }

	.btn {
		font-size: 12px;
		padding: 5px 13px;
		border: 0.5px solid rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		background: transparent;
		color: var(--color-text, #111);
		cursor: pointer;
	}
	.btn:hover { background: var(--color-bg-subtle, #f5f5f3); }

	.btn-danger {
		color: #a32d2d;
		border-color: rgba(163, 45, 45, 0.3);
		background: #fcebeb;
	}
	.btn-danger:hover { background: #f7c1c1; }

	.section-meta {
		font-size: 11px;
		color: var(--color-text-subtle, #aaa);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 24px;
	}

	.timeline {
		position: relative;
		padding-left: 32px;
	}
</style>