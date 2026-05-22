<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import { utcToIstFormat, utcToIstTime } from '$lib/helpers';
	import { goto } from '$app/navigation';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import { fetchLandmarkList } from '$lib/services/landmark';
	import { mapLandmarkTypeToLabel, titleCase } from '$lib/helpers';
	import type { Landmark, Route } from '$lib/types/type';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import RouteMapView from '$lib/components/route-components/RouteMapView.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Pagination from '$lib/components/Pagination.svelte';
	import { DESKTOP_BREAKPOINT } from '$lib/constants';
	import { page } from '$app/stores';
	import { fetchRoute } from '$lib/services/route-landmarks';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { canCreateRoute } from '$lib/utils/permissions';

	const canCreate = canCreateRoute();

	//-- Filter by company id from URL (accepts either ?companyId=... or ?id=... from dashboard) --
	let companyId: string | null = null;
	$: companyId =
		$page.url.searchParams.get('companyId') ?? $page.url.searchParams.get('id') ?? null;

	//-- Preserve company context params (name, status) for downstream navigation --
	let companyName: string | null = null;
	let companyStatus: string | null = null;
	$: companyName = $page.url.searchParams.get('name');
	$: companyStatus = $page.url.searchParams.get('status');

	//-- Build a reusable URLSearchParams with all company context --
	function buildCompanyParams(): URLSearchParams {
		const params = new URLSearchParams();
		if (companyId) params.set('companyId', companyId);
		if (companyName) params.set('name', companyName);
		if (companyStatus) params.set('status', companyStatus);
		return params;
	}
	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;
	let hasNextPage = false;
	let requestId = 0;

	let formattedRoutes: Route[] = [];
	let loading = false;
	let totalItems = 0;
	let previousCompanyId: string | null | undefined = undefined;
	let hasInitializedCompanyContext = false;

	//-- Map landmarks (fetched by viewport location or initial full fetch) --
	let mapLandmarks: Landmark[] = [];
	let mapRequestId = 0;
	let viewChangedTimer: ReturnType<typeof setTimeout> | null = null;
	const MAP_DEBOUNCE_MS = 500;

	//-- Map visibility states --
	let showMap = false;
	let isLargeScreen = false;

	async function fetchRoutes() {
		const currentRequestId = ++requestId;
		loading = true;
		hasNextPage = false;
		totalItems = 0;
		const parsedCompanyId = companyId ? Number(companyId) : undefined;
		const validCompanyId =
			typeof parsedCompanyId === 'number' && Number.isFinite(parsedCompanyId)
				? parsedCompanyId
				: undefined;
		try {
			const data = await fetchRoute({
				company_id: validCompanyId,
				search: searchTerm || undefined,
				limit: itemsPerPage,
				offset: (currentPage - 1) * itemsPerPage
			});
			if (currentRequestId !== requestId) return;

			formattedRoutes = Array.isArray(data)
				? (data as any[]).map(
						(route) =>
							({
								...route,
								id: route.id ? `ROUTE-${route.id}` : '',
								apiId: route.id ?? null,
								companyId: String(route.company_id ?? route.companyId ?? ''),
								name: route.name || 'Unnamed Route',
								startingTime: utcToIstTime(route.start_time ?? route.starting_time ?? ''),
								createdAt: utcToIstFormat(route.created_on ?? route.createdAt ?? ''),
								updatedAt: utcToIstFormat(route.updated_on ?? route.updatedAt ?? ''),
								status:
									route.status === 1 || String(route.status).toLowerCase() === 'valid'
										? 'Valid'
										: 'Invalid'
							}) as Route
					)
				: [];
			if (Array.isArray(data)) {
				const fetchedCount = (currentPage - 1) * itemsPerPage + data.length;
				if (data.length === 0 && currentPage > 1) {
					currentPage = Math.max(1, currentPage - 1);
					return await fetchRoutes();
				}
				hasNextPage = data.length === itemsPerPage;
				totalItems = hasNextPage ? fetchedCount + 1 : fetchedCount;
			} else {
				totalItems = 0;
				hasNextPage = false;
			}
		} catch (err: any) {
			if (currentRequestId !== requestId) return; //-- stale error, discard --
			formattedRoutes = [];
			totalItems = 0;
			hasNextPage = false;
			const message = await handleApiError(err);
			toast.error(message || 'Failed to fetch routes.');
		} finally {
			if (currentRequestId === requestId) loading = false;
		}
	}

	//-- Fetch many landmarks to show on route map (similar to landmark page behavior)
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
			mapLandmarks = Array.isArray(apiData)
				? apiData.map(
						(landmark: any) =>
							({
								...landmark,
								id: landmark.id ? `LAN-${landmark.id}` : '',
								apiId: landmark.id ?? null,
								name: landmark.name ?? '',
								boundary: landmark.boundary ?? '',
								type: titleCase(mapLandmarkTypeToLabel(landmark.type)),
								createdAt: utcToIstFormat(landmark.created_on ?? landmark.createdAt ?? ''),
								updatedAt: utcToIstFormat(landmark.updated_on ?? landmark.updatedAt ?? '')
							}) as Landmark
					)
				: [];
		} catch (e) {
			if (currentMapRequestId !== mapRequestId) return;
			//-- Silently ignore viewport fetch errors so existing landmarks stay visible.
			//-- For the initial (non-viewport) fetch, surface the error to the user.
			if (isViewportFetch) {
				// no-op for viewport refresh failures
			} else {
				const message = await handleApiError(e);
				toast.error(message || 'Failed to fetch landmarks.');
				mapLandmarks = [];
			}
		}
	}

	onMount(() => {
		fetchRoutes();
		fetchAllLandmarks();
	});

	//-- Handle map viewport change (debounced) --
	function handleViewChanged(event: CustomEvent<{ location: string; zoom: number }>) {
		if (viewChangedTimer) clearTimeout(viewChangedTimer);
		viewChangedTimer = setTimeout(() => {
			fetchAllLandmarks(event.detail.location, event.detail.zoom);
		}, MAP_DEBOUNCE_MS);
	}
	//-- Check screen size --
	function checkScreenSize() {
		if (browser) {
			isLargeScreen = window.innerWidth > DESKTOP_BREAKPOINT;
			if (isLargeScreen) {
				showMap = true;
			}
		}
	}
	//-- Initialize previousCompanyId on first render, then refetch if company context changes --
	$: if (!hasInitializedCompanyContext) {
		previousCompanyId = companyId;
		hasInitializedCompanyContext = true;
	} else if (companyId !== previousCompanyId) {
		previousCompanyId = companyId;
		currentPage = 1;
		fetchRoutes();
	}

	function handlePageChange(p: number) {
		currentPage = p;
		fetchRoutes();
	}

	//-- Navigation to route detail page --
	function handleShowDetailPage(route: any) {
		if (!route?.apiId) return;
		const params = buildCompanyParams();
		params.set('routeId', String(route.apiId));
		goto(`/company/service-route/route-detail?${params.toString()}`);
	}

	//-- Search/Filter setup --
	let searchTerm = '';
	//-- Handle search/filter updates --
	async function handleSearchUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		currentPage = 1;
		await fetchRoutes();
	}

	//-- Toggle map visibility --
	function toggleMap() {
		showMap = !showMap;
	}

	//-- Close map (for small screens) --
	function closeMap() {
		if (!isLargeScreen) {
			showMap = false;
		}
	}

	//-- Setup resize listener --
	onMount(() => {
		if (browser) {
			checkScreenSize();
			window.addEventListener('resize', checkScreenSize);
		}
	});
	//-- Cleanup resize listener and pending timers --
	onDestroy(() => {
		if (viewChangedTimer) {
			clearTimeout(viewChangedTimer);
			viewChangedTimer = null;
		}

		if (browser) {
			window.removeEventListener('resize', checkScreenSize);
		}
	});
</script>

<div class="main-div d-flex flex-column min-vh-100">
	{#if loading}
		<div class="spinner-overlay">
			<div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{/if}
	<div class="d-flex flex-column">
		<div class="sticky-top">
			<HeaderBar />
		</div>
		<main class="container-xl py-5 page-wrapper">
			<!-- HOME BUTTON -->
			<HomeButton
				icon="bi bi-arrow-left"
				ariaLabel="Back"
				to="/company/dashboard"
				preserveQuery={true}
			/>
			<!-- PAGE HEADER -->
			<ListingPageHeader
				title="Route Management"
				subtitle="View and manage all Routes"
				buttonLabel="Add New Route"
				isInitiallyEnabled={canCreate}
				disabledTooltip="You do not have permission to create routes."
				icon="bi-plus-lg"
				onButtonClick={() =>
					goto(`/company/service-route/route-create?${buildCompanyParams().toString()}`)}
			/>

			<!-- SEARCH & FILTER BAR -->
			<SearchFilterBar
				searchPlaceholder="Search by name, ID..."
				on:update={handleSearchUpdate}
				showFilter={false}
			/>

			<!-- Map overlay for small screens -->
			{#if !isLargeScreen && showMap}
				<div class="map-overlay">
					<div class="map-overlay-header">
						<h5 class="fw-inter-700" style="color: var(--text-primary);">Route Map</h5>
						<button class="btn btn-sm btn-outline-secondary" aria-label="Close" on:click={closeMap}>
							<i class="bi bi-x-lg"></i>
						</button>
					</div>
					<div class="map-overlay-content position-relative">
						<RouteMapView
							landmarks={mapLandmarks}
							autoFitLandmarks={false}
							on:viewChanged={handleViewChanged}
						/>
					</div>
				</div>
			{/if}

			<div class="route-layout row g-4">
				<!-- Left column: list -->
				<div class="col-12 {isLargeScreen ? 'col-lg-5' : ''}">
					{#each formattedRoutes as route}
						<div
							class="route-card d-flex align-items-center justify-content-between p-3 rounded-4 mb-2"
							role="button"
							tabindex="0"
							on:click={() => handleShowDetailPage(route)}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									handleShowDetailPage(route);
								}
							}}
						>
							<!-- Left section -->
							<div class="d-flex align-items-center gap-3">
								<!-- Icon -->
								<div class="route-icon">
									<i class="bi bi-arrow-left-right"></i>
								</div>

								<!-- Info -->
								<div class="route-info">
									<div class="route-name fw-inter-700">
										{route.name}
									</div>
									<div class="route-meta d-flex align-items-center gap-2 mt-1">
										<span class="route-id">{route.id}</span>
										<span class="meta-dot">·</span>
										<span class="meta-time-group d-flex align-items-center gap-2">
											<i class="bi bi-clock meta-icon" aria-hidden="true"></i>
											<span class="meta-time">{route.startingTime}</span>
										</span>
									</div>
								</div>
							</div>

							<!-- Right section -->
							<div class="d-flex align-items-center gap-3">
								<span class="route-badge {route.status.toLowerCase()} fw-inter-600">
									{route.status}
								</span>
								<i class="bi bi-chevron-right text-secondary"></i>
							</div>
						</div>
					{/each}

					{#if formattedRoutes.length === 0}
						<EmptyData message="No Routes found" />
					{/if}
					<!-- Pagination -->
					{#if totalItems > 0 || hasNextPage}
						<Pagination
							{totalItems}
							{itemsPerPage}
							{currentPage}
							hasMore={hasNextPage}
							onPageChange={handlePageChange}
						/>
					{/if}
				</div>

				<!-- Right column: map preview (only on large screens) -->
				{#if isLargeScreen && showMap}
					<div class="col-12 col-lg-7">
						<RouteMapView
							landmarks={mapLandmarks}
							autoFitLandmarks={false}
							on:viewChanged={handleViewChanged}
						/>
					</div>
				{/if}
				{#if !isLargeScreen && !showMap}
					<!-- Floating Add Button (shown first on small screens) -->
					<div class="floating-add-btn-overlay">
						<FloatingAddButton
							tooltip="Add new route"
							isInitiallyEnabled={canCreate}
							onClick={() =>
								goto(`/company/service-route/route-create?${buildCompanyParams().toString()}`)}
						/>
					</div>
				{/if}

				{#if !isLargeScreen && showMap}
					<button
						class="floating-map-btn btn rounded-circle position-fixed shadow d-flex align-items-center bg-primary justify-content-center"
						on:click={toggleMap}
						style="z-index: var(--home-button-z-index);"
						title="Hide Map"
					>
						<i class="bi bi-geo-alt-fill fs-4 text-white"></i>
					</button>
				{/if}
			</div>
		</main>
	</div>
</div>

<!-- Styles -->
<style>
	.main-div {
		background-color: var(--bg-primary);
		position: relative;
	}

	@media (max-width: 768px) {
		main {
			padding: 2rem;
		}
	}

	@media (max-width: 1200px) {
		.page-wrapper {
			padding: 2rem;
		}
	}

	.route-card {
		background-color: var(--bg-card);
		cursor: pointer;
		transition:
			box-shadow 0.2s ease,
			transform 0.15s ease;
	}

	.route-card:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
		transform: translateY(-1px);
	}

	.route-icon {
		width: 48px;
		height: 48px;
		min-width: 48px;
		border-radius: 50%;
		background-color: var(--bg-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-primary);
		font-size: 1.15rem;
	}

	.route-name {
		color: var(--text-primary);
		font-size: 0.95rem;
		line-height: 1.3;
	}

	.route-id {
		color: var(--text-muted);
		font-size: 0.78rem;
	}

	.route-meta {
		font-size: 0.8rem;
		color: var(--text-muted);
		flex-wrap: wrap;
	}

	.meta-dot {
		color: var(--text-muted);
		font-weight: 700;
	}

	.meta-icon {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.meta-time {
		color: var(--text-muted);
		font-weight: 500;
	}

	.meta-sep {
		color: var(--text-muted);
	}

	.route-badge {
		font-size: 0.65rem;
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		white-space: nowrap;
		min-width: 56px;
		text-align: center;
		display: inline-block;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.route-badge.valid {
		background-color: var(--online-bg);
		color: var(--online-fg);
	}

	.route-badge.invalid {
		background-color: #fde8e8;
		color: #b91c1c;
	}

	:root.dark .route-badge.invalid {
		background-color: rgba(217, 83, 79, 0.15);
		color: #f87171;
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

	.floating-add-btn-overlay {
		position: absolute;
		bottom: 40px;
		right: 20px;
		z-index: 1100;
	}

	@media (max-width: 768px) {
		.route-icon {
			width: 42px;
			height: 42px;
			min-width: 42px;
			font-size: 1rem;
		}

		.route-name {
			font-size: 0.9rem;
		}

		.route-meta {
			font-size: 0.75rem;
		}

		.route-badge {
			font-size: 0.6rem;
			padding: 0.2rem 0.5rem;
		}
	}

	@media (max-width: 560px) {
		.route-meta {
			flex-direction: column;
			align-items: flex-start !important;
			gap: 0.15rem !important;
		}

		.meta-dot {
			display: none;
		}

		.meta-time-group {
			order: -1;
		}
	}

	@media (max-width: 480px) {
		.route-icon {
			width: 38px;
			height: 38px;
			min-width: 38px;
			font-size: 0.95rem;
		}

		.route-name {
			font-size: 0.85rem;
		}

		.route-meta {
			font-size: 0.72rem;
		}

		.route-badge {
			display: none;
		}
	}
</style>
