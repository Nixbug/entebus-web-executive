<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import RouteDetailView from '$lib/components/route-components/RouteDetailView.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { DESKTOP_BREAKPOINT } from '$lib/constants';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		formatDistance,
		parseStartingTime,
		utcToIstTime,
		mapLandmarkTypeToLabel,
		titleCase
	} from '$lib/helpers';
	import { fetchRoute, fetchLandmarkInRoute } from '$lib/services/route-landmarks';
	import { fetchLandmarkList } from '$lib/services/landmark';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import type { Landmark, Route } from '$lib/types/type';

	//-- Get route ID from URL --
	let routeId: string | null = null;
	$: routeId = $page.url.searchParams.get('routeId') ?? null;

	//-- Loading state --
	let loading = false;

	//-- Route data --
	let route: Route | null = null;

	//-- Landmarks master list (fetched from API, updates on viewport changes) --
	let landmarks: Landmark[] = [];

	//-- Initial landmarks snapshot (set once, used to resolve route landmark details) --
	let initialLandmarks: Landmark[] = [];

	//-- Map request tracking for viewport-based landmark fetching --
	let mapRequestId = 0;
	let viewChangedTimer: ReturnType<typeof setTimeout> | null = null;
	const MAP_DEBOUNCE_MS = 500;
	let autoFitMap = true;

	//-- Landmarks in this route (fetched from API) --
	let routeLandmarkEntries: Array<{
		id: string;
		routeId: string;
		landmarkId: string;
		distanceFromStart: number;
		arrivalDelta: number;
		departureDelta: number;
	}> = [];

	//-- Map API landmark item to UI Landmark row format --
	function toLandmarkRow(item: any): Landmark {
		return {
			id: item.id ? `LAN-${item.id}` : '',
			apiId: item.id ?? null,
			name: item.name ?? '',
			boundary: item.boundary ?? '',
			type: titleCase(mapLandmarkTypeToLabel(item.type))
		};
	}

	//-- Fetch landmarks by viewport location (mirrors listing page pattern) --
	async function fetchAllLandmarks(location?: string, zoom?: number) {
		const currentMapRequestId = ++mapRequestId;
		const isViewportFetch = !!location && typeof zoom === 'number';
		const limit = isViewportFetch ? Math.min(100, Math.max(20, Math.floor(zoom * 5))) : 100;
		try {
			const apiData = await fetchLandmarkList({
				...(isViewportFetch ? { location } : {}),
				limit,
				...(isViewportFetch ? { order_by: 'location', order_in: 'asc' } : {})
			});
			if (currentMapRequestId !== mapRequestId) return;
			landmarks = Array.isArray(apiData) ? apiData.map(toLandmarkRow) : [];
		} catch (e) {
			if (currentMapRequestId !== mapRequestId) return;
			//-- silently ignore errors on viewport fetches; show error only for initial fetch --
			if (!isViewportFetch) {
				const message = await handleApiError(e);
				toast.error(message || 'Failed to fetch landmarks.');
				landmarks = [];
			}
		}
	}

	//-- Handle map viewport change (debounced) --
	function handleViewChanged(event: CustomEvent<{ location: string; zoom: number }>) {
		if (viewChangedTimer) clearTimeout(viewChangedTimer);
		viewChangedTimer = setTimeout(() => {
			fetchAllLandmarks(event.detail.location, event.detail.zoom);
		}, MAP_DEBOUNCE_MS);
	}

	//-- Fetch route detail + landmarks in route + all landmarks --
	async function loadRouteDetail() {
		if (!routeId) return;
		const numericId = Number(routeId);
		if (!Number.isFinite(numericId)) return;

		loading = true;
		try {
			//-- Fetch route, landmarks in route, and landmarks list in parallel --
			const [routeData, landmarkInRouteData] = await Promise.all([
				fetchRoute({ id: numericId }),
				fetchLandmarkInRoute({ route_id: numericId })
			]);

			//-- Map route response --
			const routeItems = Array.isArray(routeData) ? routeData : [];
			const rawRoute = routeItems[0];
			if (rawRoute) {
				route = {
					id: String(rawRoute.id ?? ''),
					apiId: rawRoute.id ?? null,
					name: rawRoute.name || 'Unnamed Route',
					companyId: String(rawRoute.company_id ?? ''),
					startingTime: utcToIstTime(rawRoute.start_time ?? ''),
					status:
						rawRoute.status === 1 || String(rawRoute.status).toLowerCase() === 'valid'
							? 'Valid'
							: 'Invalid'
				} as Route;
			} else {
				route = null;
			}

			//-- Map landmarks in route response --
			const lirItems = Array.isArray(landmarkInRouteData) ? landmarkInRouteData : [];
			routeLandmarkEntries = lirItems
				.map((lir: any) => ({
					id: String(lir.id ?? ''),
					routeId: String(lir.route_id ?? ''),
					landmarkId: String(lir.landmark_id ?? lir.landmarkId ?? ''),
					distanceFromStart: lir.distance_from_start ?? lir.distanceFromStart ?? 0,
					arrivalDelta: lir.arrival_delta ?? lir.arrivalDelta ?? 0,
					departureDelta: lir.departure_delta ?? lir.departureDelta ?? 0
				}))
				.sort(
					(a: { distanceFromStart: number }, b: { distanceFromStart: number }) =>
						a.distanceFromStart - b.distanceFromStart
				);

			//-- Initial full landmark fetch (no location) --
			await fetchAllLandmarks();
			//-- Snapshot initial landmarks for route resolution (won't change on viewport fetches) --
			initialLandmarks = [...landmarks];
			//-- After initial load, stop auto-fitting so user can freely pan/zoom --
			autoFitMap = false;
		} catch (err: any) {
			const message = await handleApiError(err);
			toast.error(message || 'Failed to load route details.');
		} finally {
			loading = false;
		}
	}

	//-- Reload when routeId changes --
	$: if (routeId) {
		loadRouteDetail();
	}

	//-- Resolve full landmark details for each entry (uses initial snapshot, not viewport landmarks) --
	$: resolvedLandmarks = routeLandmarkEntries.map((entry, index) => {
		const lm = initialLandmarks.find(
			(l) => String(l.apiId) === entry.landmarkId || l.id === entry.landmarkId
		);
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
		goto(`/company/service-route?${$page.url.searchParams.toString()}`);
	}

	//-- Handle adding a landmark to the route --
	function handleAddLandmark(event: CustomEvent<any>) {
		const detail = event.detail;
		if (!routeId) return;
		//-- TODO: Implement actual API call --
		routeLandmarkEntries = [
			...routeLandmarkEntries,
			{
				id: `lir-${Date.now()}`,
				routeId: routeId,
				landmarkId: detail.landmarkId,
				arrivalDelta: detail.arrivalDelta ?? 0,
				departureDelta: detail.departureDelta ?? 0,
				distanceFromStart: detail.distanceFromStart ?? 0
			}
		].sort((a, b) => a.distanceFromStart - b.distanceFromStart);
	}

	//-- Handle editing a landmark in the route --
	function handleEditLandmark(event: CustomEvent<any>) {
		const detail = event.detail;
		if (!routeId) return;
		routeLandmarkEntries = routeLandmarkEntries
			.map((entry) => {
				const isMatch =
					detail.entryId != null
						? entry.id === detail.entryId
						: entry.landmarkId === detail.landmarkId;
				if (isMatch) {
					return {
						...entry,
						arrivalDelta: detail.arrivalDelta ?? entry.arrivalDelta,
						departureDelta: detail.departureDelta ?? entry.departureDelta,
						distanceFromStart: detail.distanceFromStart ?? entry.distanceFromStart
					};
				}
				return entry;
			})
			.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
	}

	//-- Handle deleting a landmark from the route --
	function handleDeleteLandmark(event: CustomEvent<{ landmarkId: string }>) {
		const { landmarkId } = event.detail;
		if (!routeId) return;
		routeLandmarkEntries = routeLandmarkEntries.filter(
			(lir) => lir.id !== landmarkId && lir.landmarkId !== landmarkId
		);
	}

	//-- Handle editing route name/startingTime --
	function handleEditRoute(
		event: CustomEvent<{ routeId: string; name?: string; startingTime?: string }>
	) {
		const { name, startingTime } = event.detail;
		if (!route) return;
		if (name != null) route = { ...route, name };
		if (startingTime != null) route = { ...route, startingTime };
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
		if (viewChangedTimer) clearTimeout(viewChangedTimer);
	});
</script>

<div class="main-div d-flex flex-column min-vh-100">
	{#if loading}
		<div class="spinner-overlay">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{/if}
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
				autoFitLandmarks={autoFitMap}
				enableLandmarkClick={true}
				on:toggleMap={toggleMap}
				on:closeMap={closeMap}
				on:deleteRoute={handleDeleteRoute}
				on:addLandmark={handleAddLandmark}
				on:editLandmark={handleEditLandmark}
				on:deleteLandmark={handleDeleteLandmark}
				on:editRoute={handleEditRoute}
				on:viewChanged={handleViewChanged}
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
