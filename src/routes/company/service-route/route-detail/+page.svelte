<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import RouteMapView from '$lib/components/route-components/RouteMapView.svelte';
	import { routes, landmarks, landmarksInRoutes } from '$lib/dummy-data';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { DESKTOP_BREAKPOINT } from '$lib/constants';
	import { page } from '$app/stores';
	import { formatDistance, parseStartingTime } from '$lib/helpers';

	//-- Get route ID from URL --
	let routeId: string | null = null;
	$: routeId = $page.url.searchParams.get('routeId') ?? null;

	//-- Find the route --
	$: route = routeId ? routes.find((r) => r.id === routeId) : null;

	//-- Get landmarks for this route, sorted by distanceFromStart --
	$: routeLandmarkEntries = routeId
		? landmarksInRoutes
				.filter((lir) => lir.routeId === routeId)
				.sort((a, b) => a.distanceFromStart - b.distanceFromStart)
		: [];

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

			{#if route}
				<!-- ROUTE HEADER -->
				<div class="route-header-card rounded-4 p-4 mb-4">
					<div class="route-header-top d-flex align-items-start justify-content-between">
						<div class="d-flex align-items-center gap-3 route-header-left">
							<div>
								<div class="d-flex align-items-center gap-2 flex-wrap">
									<h4 class="fw-inter-700 mb-0 route-title">{route.name}</h4>
									<span class="route-status-badge {route.status.toLowerCase()} fw-inter-600">
										{route.status}
									</span>
								</div>
							</div>
						</div>
						<div class="route-action-btns d-flex gap-1 flex-shrink-0">
							<button class="icon-btn" title="Edit route" aria-label="Edit route">
								<i class="bi bi-pencil-square"></i>
							</button>
							<button class="icon-btn delete" title="Delete route" aria-label="Delete route">
								<i class="bi bi-trash3"></i>
							</button>
						</div>
					</div>
					<div class="route-header-meta mt-2 d-flex align-items-center gap-3 flex-wrap">
						<span class="route-header-id">
							<i class="bi bi-hash"></i>
							{route.id}
						</span>
						<span class="route-header-time">
							<i class="bi bi-clock"></i>
							{route.startingTime} – {route.endingTime}
						</span>
						<span class="route-header-landmarks">
							<i class="bi bi-geo-alt"></i>
							{resolvedLandmarks.length} Landmarks
						</span>
					</div>
				</div>

				<!-- Map overlay for small screens -->
				{#if !isLargeScreen && showMap}
					<div class="map-overlay">
						<div class="map-overlay-header">
							<h5 class="fw-inter-700" style="color: var(--text-primary);">Route Map</h5>
							<button
								class="btn btn-sm btn-outline-secondary"
								aria-label="Close"
								on:click={closeMap}
							>
								<i class="bi bi-x-lg"></i>
							</button>
						</div>
						<div class="map-overlay-content position-relative">
							<RouteMapView {landmarks} center={mapCenter} routePath={routePathPoints} />
						</div>
					</div>
				{/if}

				<!-- MAIN LAYOUT: Left landmarks + Right map -->
				<div class="detail-layout row g-4">
					<!-- Left column: Landmark timeline -->
					<div class="col-12 {isLargeScreen ? 'col-lg-5' : ''}">
						<div class="landmarks-section">
							<div class="d-flex align-items-center justify-content-between mb-3">
								<h6 class="section-title fw-inter-700 mb-0">
									<i class="bi bi-signpost-2 me-2"></i>
									Route Landmarks
								</h6>
							</div>

							{#if resolvedLandmarks.length > 0}
								<div class="landmark-timeline">
									{#each resolvedLandmarks as lm, i}
										<div
											class="timeline-item"
											class:is-first={i === 0}
											class:is-last={i === resolvedLandmarks.length - 1}
										>
											<!-- Timeline connector -->
											<div class="timeline-connector">
												<div class="timeline-line-top" class:invisible={i === 0}></div>
												<div class="timeline-dot">
													<span class="sequence-number">{lm.sequence}</span>
												</div>
												<div
													class="timeline-line-bottom"
													class:invisible={i === resolvedLandmarks.length - 1}
												></div>
											</div>

											<!-- Landmark card -->
											<div class="landmark-card rounded-3 p-3">
												<div
													class="landmark-card-header d-flex align-items-start justify-content-between"
												>
													<div>
														<div class="landmark-name fw-inter-700">
															{lm.landmarkName}
														</div>
													</div>
													<div class="d-flex align-items-center gap-1">
														<button
															class="icon-btn"
															title="Edit landmark"
															aria-label="Edit landmark"
														>
															<i class="bi bi-pencil-square"></i>
														</button>
														<button
															class="icon-btn delete"
															title="Remove landmark"
															aria-label="Remove landmark"
														>
															<i class="bi bi-trash3"></i>
														</button>
													</div>
												</div>
												<div class="landmark-card-meta d-flex align-items-center gap-2 flex-wrap">
													<span class="meta-item arrival-time" title="Arrival time">
														<i class="bi bi-arrow-down"></i>
														<strong>Arr:</strong>
														{computeTime(route.startingTime, lm.arrivalDelta)}
													</span>

													<span class="meta-item departure-time" title="Departure time">
														<i class="bi bi-arrow-up"></i>
														<strong>Dep:</strong>
														{computeTime(route.startingTime, lm.departureDelta)}
													</span>
												</div>
												<div
													class="landmark-card-meta mt-2 d-flex align-items-center gap-2 flex-wrap"
												>
													<span class="meta-item" title="Distance from start">
														<i class="bi bi-bus-front-fill"></i>
														{formatDistance(lm.distanceFromStart)}
													</span>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<EmptyData message="No landmarks found" />
							{/if}
						</div>
					</div>

					<!-- Right column: Map (large screens) -->
					{#if isLargeScreen && showMap}
						<div class="col-12 col-lg-7">
							<RouteMapView {landmarks} center={mapCenter} routePath={routePathPoints} />
						</div>
					{/if}

					<!-- Floating Map Button (small/medium screens) -->
					{#if !isLargeScreen && !showMap}
						<button
							class="floating-map-btn btn rounded-circle position-fixed shadow d-flex align-items-center bg-primary justify-content-center"
							on:click={toggleMap}
							style="z-index: var(--home-button-z-index);"
							title="Show Map"
						>
							<i class="bi bi-geo-alt-fill fs-4 text-white"></i>
						</button>
					{/if}
				</div>
			{:else}
				<EmptyData message="Route not found" />
			{/if}
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
	.route-header-card {
		background-color: var(--bg-card);
		border: 1px solid var(--border);
	}
	.route-title {
		color: var(--text-primary);
		font-size: 1.15rem;
	}

	.route-status-badge {
		font-size: 0.65rem;
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.route-status-badge.valid {
		background-color: var(--online-bg);
		color: var(--online-fg);
	}

	.route-status-badge.invalid {
		background-color: var(--clear-btn-bg);
		color: var(--error-color);
	}

	.route-header-meta {
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.route-header-meta i {
		font-size: 0.78rem;
		margin-right: 0.2rem;
	}

	.route-header-id,
	.route-header-time,
	.route-header-landmarks {
		color: var(--text-muted);
	}

	.section-title {
		color: var(--text-primary);
		font-size: 0.95rem;
	}

	.landmark-timeline {
		position: relative;
		max-height: 600px;
		overflow-y: auto;
		overflow-x: hidden;
		padding-right: 0.5rem;
		scroll-behavior: smooth;
	}

	.landmark-timeline::-webkit-scrollbar {
		width: 8px;
	}

	.landmark-timeline::-webkit-scrollbar-track {
		background: transparent;
		border-radius: 10px;
	}

	.landmark-timeline::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 10px;
		transition: background 0.2s ease;
	}

	.landmark-timeline::-webkit-scrollbar-thumb:hover {
		background: var(--text-muted);
	}

	.timeline-item {
		display: flex;
		gap: 0;
		min-height: 90px;
	}

	.timeline-item.is-last {
		min-height: auto;
	}

	.timeline-connector {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 40px;
		min-width: 40px;
		position: relative;
	}

	.timeline-line-top,
	.timeline-line-bottom {
		width: 2px;
		flex: 1;
		background-color: var(--border);
	}

	.timeline-line-top.invisible,
	.timeline-line-bottom.invisible {
		visibility: hidden;
	}

	.timeline-dot {
		width: 32px;
		height: 32px;
		min-height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #2563eb, #3b82f6);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
	}

	.sequence-number {
		color: #fff;
		font-size: 0.75rem;
		font-weight: 700;
		line-height: 1;
	}

	.landmark-card {
		flex: 1;
		background-color: var(--bg-card);
		border: 1px solid var(--border);
		margin-bottom: 0.5rem;
		margin-left: 0.5rem;
		transition:
			box-shadow 0.2s ease,
			transform 0.15s ease;
	}

	.landmark-card:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
		transform: translateY(-1px);
	}

	.landmark-name {
		color: var(--text-primary);
		font-size: 0.9rem;
		line-height: 1.3;
	}

	.landmark-type-badge {
		font-size: 0.65rem;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		background-color: var(--bg-primary);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		font-weight: 600;
		display: inline-block;
		margin-top: 0.25rem;
	}

	.landmark-id-text {
		font-size: 0.7rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.icon-btn {
		background: none;
		border: 1px solid var(--border);
		border-radius: 8px;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.icon-btn:hover {
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}

	.icon-btn.delete:hover {
		color: var(--error-color);
		border-color: var(--clear-btn);
		background-color: var(--clear-btn-bg);
	}

	.icon-btn i {
		font-size: 0.85rem;
	}

	.landmark-card-meta {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.meta-item i {
		font-size: 0.72rem;
	}

	.arrival-time {
		border-radius: 6px;
		display: inline-flex;
		align-items: center;
	}

	.departure-time {
		border-radius: 6px;
		display: inline-flex;
		align-items: center;
	}
	.map-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--bg-primary);
		z-index: 1050;
		display: flex;
		flex-direction: column;
		animation: slideIn 0.3s ease;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.map-overlay-header {
		padding: 1rem;
		background: var(--bg-card);
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.map-overlay-content {
		flex: 1;
		padding: 1rem;
		overflow: hidden;
	}

	.floating-map-btn {
		width: 56px;
		height: 56px;
		bottom: 40px;
		right: 20px;
		border: none;
		transition: all 0.3s ease;
	}

	.floating-map-btn:hover {
		transform: scale(1.1);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
	}

	@media (min-width: 1025px) {
		.floating-map-btn {
			display: none;
		}
	}

	@media (max-width: 768px) {
		main {
			padding: 2rem;
		}
		.route-header-card {
			padding: 1rem !important;
		}

		.landmark-timeline {
			max-height: 500px;
		}

		.route-title {
			font-size: 1rem;
		}

		.route-header-meta {
			padding-left: 0;
		}

		.timeline-connector {
			width: 34px;
			min-width: 34px;
		}

		.timeline-dot {
			width: 28px;
			height: 28px;
			min-height: 28px;
		}

		.sequence-number {
			font-size: 0.7rem;
		}

		.landmark-name {
			font-size: 0.85rem;
		}

		.landmark-card-meta {
			font-size: 0.72rem;
		}
	}

	@media (max-width: 480px) {
		.route-header-card {
			padding: 0.75rem !important;
		}

		.landmark-timeline {
			max-height: 400px;
		}

		.route-header-top {
			gap: 0.5rem;
		}

		.route-header-left {
			gap: 0.5rem !important;
			min-width: 0;
			overflow: hidden;
		}

		.route-title {
			font-size: 0.9rem;
			word-break: break-word;
		}

		.route-header-meta {
			flex-direction: column;
			align-items: flex-start !important;
			gap: 0.25rem !important;
			font-size: 0.75rem;
		}

		.icon-btn {
			width: 30px;
			height: 30px;
		}

		.icon-btn i {
			font-size: 0.75rem;
		}

		.landmark-card {
			padding: 0.6rem !important;
		}

		.landmark-id-text {
			display: none;
		}
	}
</style>
