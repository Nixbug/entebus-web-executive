<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import RouteDetailView from '$lib/components/route-components/RouteDetailView.svelte';
	import { routes, landmarks, landmarksInRoutes } from '$lib/dummy-data';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { DESKTOP_BREAKPOINT } from '$lib/constants';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { formatDistance, parseStartingTime } from '$lib/helpers';

	//-- Get route ID from URL --
	let routeId: string | null = null;
	$: routeId = $page.url.searchParams.get('routeId') ?? null;

	//-- Find the route --
	$: route = routeId ? routes.find((r) => r.id === routeId) : null;

	//-- Get landmarks for this route, sorted by distanceFromStart --
	let routeLandmarkEntries = routeId
		? landmarksInRoutes
				.filter((lir) => lir.routeId === routeId)
				.sort((a, b) => a.distanceFromStart - b.distanceFromStart)
		: [];
	//-- Re-derive when routeId changes --
	$: if (routeId) {
		routeLandmarkEntries = landmarksInRoutes
			.filter((lir) => lir.routeId === routeId)
			.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
	}

	//-- Resolve full landmark details for each entry --
	$: resolvedLandmarks = routeLandmarkEntries.map((entry, index) => {
		const lm = landmarks.find((l) => l.id === entry.landmarkId);
		return {
			...entry,
			sequence: index + 1,
			landmarkName: lm?.name ?? 'Unknown Landmark',
			landmarkType: lm?.type ?? '',
			boundary: lm?.boundary ?? null
		};
	});

	//-- Extract center coordinates from WKT POLYGON boundary --
	function getCenterFromBoundary(boundary: string | null): { lon: number; lat: number } | null {
		if (!boundary) return null;
		try {
			const match = boundary.match(/POLYGON\(\((.*?)\)\)/);
			if (!match) return null;
			const coords = match[1].split(',').map((c) => {
				const [lon, lat] = c.trim().split(/\s+/).map(Number);
				return { lon, lat };
			});
			const avgLon = coords.reduce((sum, c) => sum + c.lon, 0) / coords.length;
			const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
			return { lon: avgLon, lat: avgLat };
		} catch {
			return null;
		}
	}

	//-- Build route path for the map (ordered coordinates with labels) --
	$: routePathPoints = resolvedLandmarks
		.map((rl) => {
			const center = getCenterFromBoundary(rl.boundary);
			if (!center) return null;
			return {
				lon: center.lon,
				lat: center.lat,
				label: rl.landmarkName,
				sequence: rl.sequence,
				boundary: rl.boundary ?? undefined,
				landmarkId: rl.landmarkId
			};
		})
		.filter(Boolean) as Array<{
		lon: number;
		lat: number;
		label: string;
		sequence: number;
		boundary?: string;
		landmarkId: string;
	}>;

	//-- Compute map center from route path --
	$: mapCenter =
		routePathPoints.length > 0
			? {
					lat: routePathPoints.reduce((sum, p) => sum + p.lat, 0) / routePathPoints.length,
					lng: routePathPoints.reduce((sum, p) => sum + p.lon, 0) / routePathPoints.length
				}
			: { lat: 10.8505, lng: 76.2711 };

	//-- Responsive layout --
	let isLargeScreen = false;
	let showMap = false;

	//-- Check screen size and set initial map visibility --
	function checkScreenSize() {
		if (browser) {
			isLargeScreen = window.innerWidth > DESKTOP_BREAKPOINT;
			if (isLargeScreen) {
				showMap = true;
			}
		}
	}

	function toggleMap() {
		showMap = !showMap;
	}

	function closeMap() {
		if (!isLargeScreen) showMap = false;
	}

	//-- Handle route deletion --
	function handleDeleteRoute(event: CustomEvent<{ routeId: string }>) {
		const { routeId } = event.detail;
		console.log('Delete route:', routeId);
		//-- TODO: Implement actual delete API call --
		//-- For now, navigate to listing page with preserved query params --
		goto(`/company/service-route?${$page.url.searchParams.toString()}`);
	}

	//-- Handle adding a landmark to the route --
	function handleAddLandmark(event: CustomEvent<any>) {
		const detail = event.detail;
		if (!routeId) return;
		//-- Add to landmarksInRoutes (dummy data mutation for now) --
		landmarksInRoutes.push({
			id: `lir-${Date.now()}`,
			routeId: routeId,
			landmarkId: detail.landmarkId,
			arrivalDelta: detail.arrivalDelta ?? 0,
			departureDelta: detail.departureDelta ?? 0,
			distanceFromStart: detail.distanceFromStart ?? 0
		});
		//-- Trigger Svelte reactivity by reassigning the reactive dependencies --
		routeLandmarkEntries = landmarksInRoutes
			.filter((lir) => lir.routeId === routeId)
			.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
	}

	//-- Handle editing a landmark in the route --
	function handleEditLandmark(event: CustomEvent<any>) {
		const detail = event.detail;
		if (!routeId) return;
		const entryKey = detail.entryId;
		const masterKey = detail.landmarkId;
		const entry = landmarksInRoutes.find(
			(lir) =>
				lir.routeId === routeId &&
				(entryKey != null ? lir.id === entryKey : lir.landmarkId === masterKey)
		);
		if (entry) {
			entry.arrivalDelta = detail.arrivalDelta ?? entry.arrivalDelta;
			entry.departureDelta = detail.departureDelta ?? entry.departureDelta;
			entry.distanceFromStart = detail.distanceFromStart ?? entry.distanceFromStart;
			//-- Trigger Svelte reactivity --
			routeLandmarkEntries = landmarksInRoutes
				.filter((lir) => lir.routeId === routeId)
				.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
		}
	}

	//-- Handle deleting a landmark from the route --
	function handleDeleteLandmark(event: CustomEvent<{ landmarkId: string }>) {
		const { landmarkId } = event.detail;
		if (!routeId) return;
		//-- Mutate in-place (imported binding cannot be reassigned) --
		for (let i = landmarksInRoutes.length - 1; i >= 0; i--) {
			const lir = landmarksInRoutes[i];
			if (lir.routeId === routeId && (lir.id === landmarkId || lir.landmarkId === landmarkId)) {
				landmarksInRoutes.splice(i, 1);
			}
		}
		routeLandmarkEntries = landmarksInRoutes
			.filter((lir) => lir.routeId === routeId)
			.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
	}

	//-- Handle editing route name/startingTime --
	function handleEditRoute(
		event: CustomEvent<{ routeId: string; name?: string; startingTime?: string }>
	) {
		const { routeId: rid, name, startingTime } = event.detail;
		const r = routes.find((x) => x.id === rid);
		if (!r) return;
		if (name != null) r.name = name;
		if (startingTime != null) r.startingTime = startingTime;
		route = routes.find((x) => x.id === routeId) ?? route;
	}

	//-- Compute arrival/departure time based on route starting time and landmark deltas --
	function computeTime(startingTime: string, deltaSeconds: number): string {
		const baseMinutes = parseStartingTime(startingTime);
		const totalMinutes = baseMinutes + Math.floor(deltaSeconds / 60);
		let hours = Math.floor(totalMinutes / 60) % 24;
		const minutes = totalMinutes % 60;
		const period = hours >= 12 ? 'PM' : 'AM';
		if (hours > 12) hours -= 12;
		if (hours === 0) hours = 12;
		return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
	}

	onMount(() => {
		if (browser) {
			checkScreenSize();
			window.addEventListener('resize', checkScreenSize);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('resize', checkScreenSize);
		}
	});
</script>

<div class="main-div d-flex flex-column min-vh-100">
	<div class="d-flex flex-column">
		<div class="sticky-top">
			<HeaderBar />
		</div>
		<main class="container-xl py-5 page-wrapper">
			<!-- BACK BUTTON -->
			<HomeButton
				icon="bi bi-arrow-left"
				ariaLabel="Back to routes"
				to="/company/service-route"
				preserveQuery={true}
			/>

			<RouteDetailView
				{route}
				{resolvedLandmarks}
				{landmarks}
				{mapCenter}
				{routePathPoints}
				{isLargeScreen}
				{showMap}
				{computeTime}
				{formatDistance}
				enableLandmarkClick={true}
				on:toggleMap={toggleMap}
				on:closeMap={closeMap}
				on:deleteRoute={handleDeleteRoute}
				on:addLandmark={handleAddLandmark}
				on:editLandmark={handleEditLandmark}
				on:deleteLandmark={handleDeleteLandmark}
				on:editRoute={handleEditRoute}
			/>
		</main>
	</div>
</div>

<style>
	.main-div {
		background-color: var(--bg-primary);
		position: relative;
	}

	@media (max-width: 1200px) {
		.page-wrapper {
			padding: 2rem;
		}
	}
</style>
