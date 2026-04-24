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
	import {
		fetchRoute,
		fetchLandmarkInRoute,
		deleteRoute,
		deleteRouteLandmark
	} from '$lib/services/route-landmarks';
	import { fetchLandmarkList } from '$lib/services/landmark';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import type { Landmark, Route } from '$lib/types/type';
	import { canDeleteRoute, canCreateRoute, canUpdateRoute } from '$lib/utils/permissions';

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
	// remember last loaded routeId so we can reset per-route state when component is reused
	let _lastLoadedRouteId: string | null = null;

	// request id guard to avoid stale in-flight responses overwriting newer route state
	let _loadRequestId = 0;

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
		const numericId = Number(routeId);
		if (!routeId || !Number.isFinite(numericId)) {
			loading = false;
			route = null;
			routeLandmarkEntries = [];
			initialLandmarks = [];
			toast.error('Invalid route ID.');
			goto(`/company/service-route?${$page.url.searchParams.toString()}`);
			return;
		}

		//-- Guard against stale in-flight requests --
		const currentLoadRequestId = ++_loadRequestId;

		// If the component is reused for a different routeId, reset per-route transient state
		if (_lastLoadedRouteId !== routeId) {
			_lastLoadedRouteId = routeId;
			autoFitMap = true;
			route = null;
			routeLandmarkEntries = [];
			initialLandmarks = [];
		}

		loading = true;
		try {
			//-- Fetch route detail + landmarks in route --
			const [routeData, landmarkInRouteData] = await Promise.all([
				fetchRoute({ id: numericId }),
				fetchLandmarkInRoute({ route_id: numericId })
			]);
			// bail if a newer load has started
			if (currentLoadRequestId !== _loadRequestId) return;

			//-- Map route response --
			const routeItems = Array.isArray(routeData) ? routeData : [];
			const rawRoute = routeItems[0];
			if (rawRoute) {
				const convertedTime = utcToIstTime(rawRoute.start_time ?? '');
				route = {
					id: rawRoute.id != null ? `ROUTE-${String(rawRoute.id)}` : '',
					apiId: rawRoute.id ?? null,
					name: rawRoute.name || 'Unnamed Route',
					companyId: String(rawRoute.company_id ?? ''),
					startingTime: convertedTime,
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
			// NOTE: backend provides arrival/departure deltas in MINUTES — convert to seconds
			routeLandmarkEntries = lirItems
				.map((lir: any) => ({
					id: String(lir.id ?? ''),
					routeId: String(lir.route_id ?? ''),
					landmarkId: String(lir.landmark_id ?? lir.landmarkId ?? ''),
					distanceFromStart: lir.distance_from_start ?? lir.distanceFromStart ?? 0,
					arrivalDelta: (lir.arrival_delta ?? lir.arrivalDelta ?? 0) * 60,
					departureDelta: (lir.departure_delta ?? lir.departureDelta ?? 0) * 60
				}))
				.sort(
					(a: { distanceFromStart: number }, b: { distanceFromStart: number }) =>
						a.distanceFromStart - b.distanceFromStart
				);

			//-- Initial full landmark fetch (no location) --
			await fetchAllLandmarks();
			if (currentLoadRequestId !== _loadRequestId) return;
			//-- Snapshot initial landmarks for route resolution (won't change on viewport fetches) --
			initialLandmarks = [...landmarks];

			//-- Ensure all route landmarks are present in the snapshot. The initial viewport
			//-- fetch may miss some landmarks; fetch missing ones individually by id.
			try {
				const missingIds = routeLandmarkEntries
					.map((r) => Number(r.landmarkId))
					.filter((n) => Number.isFinite(n) && !initialLandmarks.some((l) => l.apiId === n));
				if (missingIds.length > 0) {
					const BATCH_SIZE = 5;
					for (let i = 0; i < missingIds.length; i += BATCH_SIZE) {
						const batch = missingIds.slice(i, i + BATCH_SIZE);
						const fetchedLists = await Promise.all(batch.map((id) => fetchLandmarkList({ id })));
						for (const list of fetchedLists) {
							if (Array.isArray(list) && list.length > 0) {
								for (const lm of list) {
									const row = toLandmarkRow(lm);
									if (!initialLandmarks.some((x) => x.apiId === row.apiId)) {
										initialLandmarks.push(row);
									}
								}
							}
						}
						if (currentLoadRequestId !== _loadRequestId) return;
					}
				}
				// bail if a newer load started while fetching missing landmarks
				if (currentLoadRequestId !== _loadRequestId) return;
			} catch (e: any) {
				if (currentLoadRequestId !== _loadRequestId) return;
				const message = await handleApiError(e);
				toast.error(message || 'Failed to fetch route landmarks.');
			}
			//-- After initial load, stop auto-fitting so user can freely pan/zoom --
			autoFitMap = false;
		} catch (err: any) {
			if (currentLoadRequestId !== _loadRequestId) return;
			const message = await handleApiError(err);
			toast.error(message || 'Failed to load route details.');
		} finally {
			// Only clear loading for the active request
			if (currentLoadRequestId === _loadRequestId) {
				loading = false;
			}
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
	//-- Delete selected route --
	async function handleDeleteRoute() {
		if (!routeId || loading) return false;
		loading = true;
		try {
			const id = Number(routeId);
			if (!id || Number.isNaN(id)) {
				toast.error('Unable to determine route id');
				return false;
			}
			await deleteRoute(id);
			toast.success('Route deleted successfully.');
			goto(`/company/service-route?${$page.url.searchParams.toString()}`);
			return true;
		} catch (e: any) {
			const message = await handleApiError(e);
			toast.error(message || 'Failed to delete route.');
			return false;
		} finally {
			loading = false;
		}
	}

	//-- Handle adding a landmark to the route --
	function handleAddLandmark(event: CustomEvent<any>) {
		const detail = event.detail;
		if (!routeId) return;
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

	let isSubmitting = false;
	//-- Handle deleting a landmark from the route --
	async function handleDeleteLandmark(event: CustomEvent<{ routeLandmarkId: string }>) {
		const { routeLandmarkId } = event.detail;
		if (!routeLandmarkId || isSubmitting) return;
		isSubmitting = true;
		try {
			const id = Number(routeLandmarkId);
			if (!id || Number.isNaN(id)) {
				toast.error('Unable to determine landmark id');
				return false;
			}
			await deleteRouteLandmark(id);
			toast.success('Landmark deleted successfully.');
			await loadRouteDetail();
			return true;
		} catch (e: any) {
			const message = await handleApiError(e);
			toast.error(message || 'Failed to delete landmark.');
			return false;
		} finally {
			isSubmitting = false;
		}
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
		if (viewChangedTimer) {
			clearTimeout(viewChangedTimer);
			viewChangedTimer = null;
		}
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
				hasDeletePermission={canDeleteRoute()}
				hasCreatePermission={canCreateRoute()}
				hasUpdatePermission={canUpdateRoute()}
				{isSubmitting}
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
