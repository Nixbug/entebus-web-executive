<script lang="ts">
	//-- timeline.svelte
	import TimeLineStop from '$lib/components/service-components/TimeLineStop.svelte';
	import type { ServiceRouteStop, LandmarkMap, Landmark, ServiceFare } from '$lib/types/type';
	import { formatDistance as formatDistanceValue, utcToIstFormat } from '$lib/helpers';

	export let route: ServiceRouteStop[] = [];
	export let landmarkMap: LandmarkMap = {};
	export let fare: ServiceFare | null = null;

	type FareFunction = (ticketType: string, distance: number, extra: Record<string, any>) => unknown;

	type FareDisplayItem = {
		ticketType: string;
		amount: string;
	};

	type StopWithMeta = ServiceRouteStop & {
		type: 'first' | 'mid' | 'last';
		segmentDistance: number | null;
		landmark: Landmark | undefined;
		fares: FareDisplayItem[];
	};

	$: ticketTypes = fare?.attributes?.ticket_types ?? [];
	$: fareExtra = fare?.attributes?.extra ?? {};
	$: currency = fare?.attributes?.currency_type ?? '';
	$: fareCalculator = createFareCalculator(fare?.function);

	$: stopsWithSegment = route.map((stop, i): StopWithMeta => {
		const next = route[i + 1];
		const segmentDistance = next ? next.distanceFromStart - stop.distanceFromStart : null;
		const type: 'first' | 'mid' | 'last' =
			i === 0 ? 'first' : i === route.length - 1 ? 'last' : 'mid';
		const landmark = landmarkMap[stop.landmarkId];
		const fares = calculateFares(
			fareCalculator,
			ticketTypes,
			fareExtra,
			currency,
			stop.distanceFromStart
		);
		return { ...stop, type, segmentDistance, landmark, fares };
	});

	$: totalDistance = route.length ? route[route.length - 1].distanceFromStart : 0;

	$: dateLabel = route.length ? utcToIstFormat(route[0].departureAt) : '';

	function formatDistance(m: number | null): string {
		if (m == null) return '';
		return formatDistanceValue(m);
	}

	function createFareCalculator(functionCode: string | null | undefined): FareFunction | null {
		if (!functionCode?.trim()) return null;
		try {
			const createGetFare = new Function(
				`${functionCode}; return typeof getFare === 'function' ? getFare : null;`
			);
			const getFare = createGetFare();
			return typeof getFare === 'function' ? (getFare as FareFunction) : null;
		} catch {
			return null;
		}
	}

	function calculateFares(
		calculator: FareFunction | null,
		types: Array<{ id: number; name: string }>,
		extra: Record<string, any>,
		currencyCode: string,
		distance: number
	): FareDisplayItem[] {
		if (!calculator || types.length === 0) return [];

		return types
			.filter((ticketType) => Boolean(ticketType.name))
			.map((ticketType) => {
				try {
					return {
						ticketType: ticketType.name,
						amount: formatFareAmount(calculator(ticketType.name, distance, extra), currencyCode)
					};
				} catch {
					return {
						ticketType: ticketType.name,
						amount: '—'
					};
				}
			});
	}

	function formatFareAmount(value: unknown, currencyCode: string): string {
		if (typeof value === 'number' && Number.isFinite(value)) {
			if (!currencyCode) return formatNumber(value);

			try {
				const fractionDigits = Number.isInteger(value) ? 0 : 2;
				return new Intl.NumberFormat('en-IN', {
					style: 'currency',
					currency: currencyCode,
					minimumFractionDigits: fractionDigits,
					maximumFractionDigits: fractionDigits
				}).format(value);
			} catch {
				return `${currencyCode} ${formatNumber(value)}`;
			}
		}

		if (typeof value === 'string' && value.trim()) return value;
		return '—';
	}

	function formatNumber(value: number): string {
		if (Number.isInteger(value)) return String(value);
		return value.toFixed(2).replace(/\.?0+$/, '');
	}
</script>

<main class="timeline-panel">
	<div class="timeline-inner">
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
					{stop}
					landmarkName={stop.landmark?.name ?? `Landmark #${stop.landmarkId}`}
					type={stop.type}
					segmentDistance={stop.segmentDistance}
					fares={stop.fares}
				/>
			{/each}
		</div>
	</div>
</main>

<style>
	.timeline-panel {
		padding: 20px 24px;
		overflow-y: auto;
	}

	.timeline-inner {
		max-width: 920px;
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
		color: var(--text-primary);
	}

	.actions {
		display: flex;
		gap: 8px;
	}

	.btn {
		font-size: 12px;
		padding: 5px 13px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: transparent;
		color: var(--text-primary);
		cursor: pointer;
	}

	.btn:hover {
		background: var(--icon-hover-bg);
	}

	.btn-danger {
		color: var(--delete-btn);
		border-color: var(--delete-btn);
		background: var(--clear-btn-bg);
	}

	.btn-danger:hover {
		background: var(--clear-btn-bg);
		opacity: 0.85;
	}

	.section-meta {
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 18px;
	}

	.timeline {
		position: relative;
		padding-left: 26px;
	}
</style>
