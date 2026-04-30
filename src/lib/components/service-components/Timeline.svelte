<script lang="ts">
	import TimeLineStop from '$lib/components/service-components/TimeLineStop.svelte';
	import type { ServiceRouteStop, LandmarkMap, Landmark, ServiceFare } from '$lib/types/type';
	import { formatDistance as formatDistanceValue, utcToIstFormat } from '$lib/helpers';

	//-- Props --
	export let route: ServiceRouteStop[] = [];
	export let landmarkMap: LandmarkMap = {};
	export let fare: ServiceFare | null = null;
	//-- Derived state for timeline display --
	type FareFunction = (
		ticketType: string,
		distance: number,
		extras: Record<string, any>
	) => unknown;
	//-- For display purposes, we combine route stop data with landmark info and calculated fares into a single structure --
	type FareDisplayItem = {
		ticketType: string;
		amount: string;
	};
	//-- This type represents a route stop enriched with additional metadata for display in the timeline --
	type StopWithMeta = ServiceRouteStop & {
		type: 'first' | 'mid' | 'last';
		segmentDistance: number | null;
		landmark: Landmark | undefined;
		fares: FareDisplayItem[];
	};

	//-- Reactive statements to derive display data from props --
	$: ticketTypes = fare?.attributes?.ticket_types ?? [];
	$: fareExtras = fare?.attributes?.extras ?? {};
	$: currency = fare?.attributes?.currency_type ?? '';
	$: fareCalculator = createFareCalculator(fare?.function);

	$: stopsWithSegment = route.map((stop, i): StopWithMeta => {
		const next = route[i + 1];
		const segmentDistance =
			next &&
			typeof next.distanceFromStart === 'number' &&
			typeof stop.distanceFromStart === 'number'
				? Math.max(0, next.distanceFromStart - stop.distanceFromStart)
				: null;
		const type: 'first' | 'mid' | 'last' =
			i === 0 ? 'first' : i === route.length - 1 ? 'last' : 'mid';
		const landmark = landmarkMap[stop.landmarkId];
		const fares = calculateFares(
			fareCalculator,
			ticketTypes,
			fareExtras,
			currency,
			stop.distanceFromStart
		);
		return { ...stop, type, segmentDistance, landmark, fares };
	});

	$: totalDistance = route.length ? route[route.length - 1].distanceFromStart : 0;

	$: dateLabel = route.length ? utcToIstFormat(route[0].departureAt) : '';

	//-- Helper functions --
	//-- Format distance in meters to a human-readable string (e.g., "1.2 km" or "500 m") --
	function formatDistance(m: number | null): string {
		if (m == null) return '';
		return formatDistanceValue(m);
	}

	//-- Safely create a fare calculator function from the provided code string. The code is expected to define a function named `getFare`. If the code is invalid or does not define `getFare`, this will return null. --
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

	//-- Props for loading landmark and vehicle options in create mode (optional, only needed if timeline preview is used in create mode) --
	function calculateFares(
		calculator: FareFunction | null,
		types: Array<{ id: number; name: string }>,
		extras: Record<string, any>,
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
						amount: formatFareAmount(calculator(ticketType.name, distance, extras), currencyCode)
					};
				} catch {
					return {
						ticketType: ticketType.name,
						amount: '—'
					};
				}
			});
	}

	//-- These functions can be passed in create mode to allow the timeline preview to load options for landmarks, fares, and vehicles based on user input in the form. They should return a promise that resolves to an array of options matching the expected format. --
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

	//-- Format a number to a human-readable string --
	function formatNumber(value: number): string {
		if (Number.isInteger(value)) return String(value);
		return value.toFixed(2).replace(/\.?0+$/, '');
	}
</script>

<main class="timeline-panel">
	<div class="timeline-inner">
		<div class="top-bar">
			<h2 class="panel-title">Route timeline</h2>
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
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px 24px;
		overflow: hidden;
	}

	.timeline-inner {
		max-width: 920px;
		width: 100%;
	}

	.top-bar {
		display: flex;
		align-items: center;
		margin-bottom: 6px;
	}

	.panel-title {
		font-size: 16px;
		font-weight: 500;
		color: var(--text-primary);
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
		padding-left: 0;
	}
</style>
