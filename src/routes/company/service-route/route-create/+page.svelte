<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import RouteDetailView from '$lib/components/route-components/RouteDetailView.svelte';
	import { landmarks } from '$lib/dummy-data';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { DESKTOP_BREAKPOINT } from '$lib/constants';
	import { formatDistance, parseStartingTime } from '$lib/helpers';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	//-- Placeholder route for create mode --
	let route = { id: '', name: '', startingTime: '12:00 AM', status: 'DRAFT' };

	//-- Added landmarks list (populated when user clicks map landmarks and fills the form) --
	let addedLandmarks: any[] = [];

	//-- Layout state --
	let isLargeScreen = false;
	let showMap = false;

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

	//-- Build route path from added landmarks --
	$: routePathPoints = addedLandmarks
		.map((rl) => {
			const lm = landmarks.find((l) => l.id === rl.landmarkId);
			const boundary = lm?.boundary || rl.boundary || null;
			const center = getCenterFromBoundary(boundary);
			if (!center) return null;
			return {
				lon: center.lon,
				lat: center.lat,
				label: rl.landmarkName,
				sequence: rl.sequence,
				boundary: boundary ?? undefined,
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

	//-- Map center (average of all added landmarks, or default) --
	$: mapCenter =
		routePathPoints.length > 0
			? {
					lat: routePathPoints.reduce((sum, p) => sum + p.lat, 0) / routePathPoints.length,
					lng: routePathPoints.reduce((sum, p) => sum + p.lon, 0) / routePathPoints.length
				}
			: { lat: 10.8505, lng: 76.2711 };

	//-- Compute arrival/departure time based on starting time and delta --
	function computeTime(st: string, deltaSeconds: number): string {
		const baseMinutes = parseStartingTime(st);
		const totalMinutes = baseMinutes + Math.floor(deltaSeconds / 60);
		let hours = Math.floor(totalMinutes / 60) % 24;
		const minutes = totalMinutes % 60;
		const period = hours >= 12 ? 'PM' : 'AM';
		if (hours > 12) hours -= 12;
		if (hours === 0) hours = 12;
		return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
	}

	//-- Handle add landmark from map click --
	function handleAddLandmark(event: CustomEvent) {
		const detail = event.detail;
		const newLandmark = {
			id: `NEW-LIR-${Date.now()}`,
			landmarkId: detail.landmarkId,
			landmarkName: detail.landmarkName,
			arrivalDelta: detail.arrivalDelta,
			departureDelta: detail.departureDelta,
			distanceFromStart: detail.distanceFromStart,
			sequence: addedLandmarks.length + 1
		};
		addedLandmarks = [...addedLandmarks, newLandmark].sort(
			(a, b) => a.distanceFromStart - b.distanceFromStart
		);
		addedLandmarks = addedLandmarks.map((lm, i) => ({ ...lm, sequence: i + 1 }));
	}

	//-- Handle delete landmark --
	function handleDeleteLandmark(event: CustomEvent) {
		const { landmarkId } = event.detail;
		addedLandmarks = addedLandmarks
			.filter((lm) => lm.id !== landmarkId)
			.map((lm, i) => ({ ...lm, sequence: i + 1 }));
	}

	//-- Handle create route submission --
	function handleCreateRoute(event: CustomEvent) {
		const { name, startingTime } = event.detail;
		const routeData = {
			name,
			startingTime,
			landmarks: addedLandmarks.map((lm) => ({
				landmarkId: lm.landmarkId,
				distanceFromStart: lm.distanceFromStart,
				arrivalDelta: lm.arrivalDelta,
				departureDelta: lm.departureDelta
			}))
		};
		console.log('Create route:', routeData);
		//-- TODO: API call to create route --
		const params = $page.url.searchParams.toString();
		goto(params ? `/company/service-route?${params}` : '/company/service-route');
	}

	//-- Handle cancel --
	function handleCancelCreate() {
		const params = $page.url.searchParams.toString();
		goto(params ? `/company/service-route?${params}` : '/company/service-route');
	}

	//-- Layout --
	function toggleMap() {
		showMap = !showMap;
	}

	function closeMap() {
		if (!isLargeScreen) showMap = false;
	}

	function checkScreenSize() {
		if (browser) {
			isLargeScreen = window.innerWidth > DESKTOP_BREAKPOINT;
			if (isLargeScreen) showMap = true;
		}
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
				resolvedLandmarks={addedLandmarks}
				{landmarks}
				{mapCenter}
				{routePathPoints}
				{isLargeScreen}
				{showMap}
				{computeTime}
				{formatDistance}
				mode="create"
				on:toggleMap={toggleMap}
				on:closeMap={closeMap}
				on:addLandmark={handleAddLandmark}
				on:deleteLandmark={handleDeleteLandmark}
				on:createRoute={handleCreateRoute}
				on:cancelCreate={handleCancelCreate}
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
