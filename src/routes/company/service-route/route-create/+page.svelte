<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import RouteDetailView from '$lib/components/route-components/RouteDetailView.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { DESKTOP_BREAKPOINT } from '$lib/constants';
	import {
		formatDistance,
		mapLandmarkTypeToLabel,
		parseStartingTime,
		titleCase
	} from '$lib/helpers';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fetchLandmarkList } from '$lib/services/landmark';
	import type { Landmark } from '$lib/types/type';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { createRoute, createLandmarkInRoute } from '$lib/services/route-landmarks';

	//-- Placeholder route for create mode --
	let route = { id: '', name: '', startingTime: '12:00 AM', status: 'DRAFT' };

	//-- Loading state --
	let loading = false;

	//-- Added landmarks list (populated when user clicks map landmarks and fills the form) --
	let addedLandmarks: any[] = [];

	//-- Landmarks master list (fetched from API, updates on viewport changes) --
	let landmarks: Landmark[] = [];
	//-- Layout state --
	let isLargeScreen = false;
	let showMap = false;

	//-- Map request tracking for viewport-based landmark fetching --
	let mapRequestId = 0;
	let viewChangedTimer: ReturnType<typeof setTimeout> | null = null;
	const MAP_DEBOUNCE_MS = 500;
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

	function handleEditLandmark(event: CustomEvent<any>) {
		const d = event.detail;
		const entryKey = d.entryId;
		const masterKey = d.landmarkId;
		addedLandmarks = addedLandmarks
			.map((lm) =>
				(entryKey != null ? lm.id === entryKey : lm.landmarkId === masterKey)
					? {
							...lm,
							arrivalDelta: d.arrivalDelta ?? lm.arrivalDelta,
							departureDelta: d.departureDelta ?? lm.departureDelta,
							distanceFromStart: d.distanceFromStart ?? lm.distanceFromStart
						}
					: lm
			)
			.sort((a, b) => a.distanceFromStart - b.distanceFromStart)
			.map((lm, i) => ({ ...lm, sequence: i + 1 }));
	}

	//-- Handle delete landmark --
	function handleDeleteLandmark(event: CustomEvent) {
		const { landmarkId } = event.detail;
		addedLandmarks = addedLandmarks
			.filter((lm) => lm.id !== landmarkId)
			.map((lm, i) => ({ ...lm, sequence: i + 1 }));
	}

	//-- Handle create route submission --
	async function handleCreateRoute(event: CustomEvent) {
		const { name, startingTime } = event.detail;
		// determine company id from URL params
		const companyIdParam = $page.url.searchParams.get('companyId') ?? $page.url.searchParams.get('id');
		const companyId = companyIdParam ? Number(companyIdParam) : undefined;
		if (!companyId || !Number.isFinite(companyId)) {
			toast.error('Missing or invalid company id.');
			return;
		}

		loading = true;
		try {
			// create route (API expects UTC time string like "01:30:00Z")
			// parseStartingTime returns minutes since midnight in local (IST) minutes
			const localMinutes = parseStartingTime(startingTime);
			// IST is UTC+5:30 => subtract 330 minutes to get UTC minutes
			const utcMinutes = ((localMinutes - 330) % 1440 + 1440) % 1440;
			const utcHours = Math.floor(utcMinutes / 60);
			const utcMins = utcMinutes % 60;
			const utcTimeStr = `${utcHours.toString().padStart(2, '0')}:${utcMins
				.toString()
				.padStart(2, '0')}:00Z`;

			const createPayload = {
				name,
				start_time: utcTimeStr,
				company_id: companyId
			} as any;
			console.log('Creating route with payload:', createPayload);
			const created = await createRoute(createPayload);
			console.log('Created route response:', created);
			// created may be object or array depending on API client; extract `id` only
			const createdId = Array.isArray(created) ? created[0]?.id : created?.id;
			if (!createdId) {
				throw new Error('Failed to obtain created route id');
			}

			// add landmarks one-by-one (API expects deltas in MINUTES)
			for (const lm of addedLandmarks) {
				// derive numeric landmark id (support values like 'LAN-8' or raw number)
				const raw = String(lm.landmarkId ?? lm.apiId ?? '');
				const numericLandmarkId = Number(raw.replace(/^LAN-/, '')) || Number(lm.apiId) || null;
				if (!numericLandmarkId) continue;

				// arrival/departure in UI may be stored in seconds; convert to minutes for API
				const arrivalMinutes = Math.round((lm.arrivalDelta ?? 0) / 60);
				const departureMinutes = Math.round((lm.departureDelta ?? 0) / 60);

				const lmPayload = {
					route_id: createdId,
					landmark_id: numericLandmarkId,
					distance_from_start: lm.distanceFromStart ?? 0,
					arrival_delta: arrivalMinutes,
					departure_delta: departureMinutes
				} as any;

				await createLandmarkInRoute(lmPayload);
			}

			toast.success('Route and landmarks created successfully.');
			const params = $page.url.searchParams.toString();
			goto(params ? `/company/service-route?${params}` : '/company/service-route');
		} catch (e: any) {
			const message = await handleApiError(e);
			toast.error(message || 'Failed to create route.');
		} finally {
			loading = false;
		}
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
				autoFitLandmarks={false}
				on:toggleMap={toggleMap}
				on:closeMap={closeMap}
				on:addLandmark={handleAddLandmark}
				on:editLandmark={handleEditLandmark}
				on:deleteLandmark={handleDeleteLandmark}
				on:createRoute={handleCreateRoute}
				on:cancelCreate={handleCancelCreate}
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
