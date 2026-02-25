<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import { applySearchAndFilters } from '$lib/helpers';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import { routes, landmarks } from '$lib/dummy-data';
	import type { Route } from '$lib/types/type';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import RouteMapView from '$lib/components/route-components/RouteMapView.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Pagination from '$lib/components/Pagination.svelte';
	import { DESKTOP_BREAKPOINT } from '$lib/constants';
	import { page } from '$app/stores';

	//-- Filter by company id from URL (accepts either ?companyId=... or ?id=... from dashboard) --
	let companyId: string | null = null;
	$: companyId =
		$page.url.searchParams.get('companyId') ?? $page.url.searchParams.get('id') ?? null;
	//-- Routes scoped to current company (or all if no companyId provided) --
	$: baseRoutes = companyId ? routes.filter((r) => r.companyId === companyId) : routes;

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;

	let filtered: Route[] = [...(baseRoutes ?? routes)];
	let paginated: Route[] = [];

	//-- Map visibility states --
	let showMap = false;
	let isLargeScreen = false;

	$: {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		paginated = filtered.slice(start, end);
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

	function handlePageChange(p: number) {
		currentPage = p;
	}

	//-- Search/Filter setup --
	let searchTerm = '';
	let activeFilters = {};
	const filters = [
		{
			label: 'Status',
			key: 'status',
			options: ['VALID', 'INVALID']
		}
	];

	//-- Handle search/filter updates --
	function handleSearchAndFilterUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		activeFilters = event.detail.activeFilters;
		filtered = applySearchAndFilters(baseRoutes, searchTerm, {
			searchKeys: ['name', 'id'],
			filters: activeFilters
		});

		currentPage = 1;
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
	//-- Cleanup resize listener --
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
				buttonLabel="Add Route"
				icon="bi-plus-lg"
			/>

			<!-- SEARCH & FILTER BAR -->
			<SearchFilterBar
				searchPlaceholder="Search by name, ID..."
				{filters}
				on:update={handleSearchAndFilterUpdate}
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
						<RouteMapView {landmarks} />
						<!-- Floating Add Button inside map overlay -->
						<div class="floating-add-btn-overlay">
							<FloatingAddButton tooltip="Add new route" />
						</div>
					</div>
				</div>
			{/if}

			<div class="route-layout row g-4">
				<!-- Left column: list -->
				<div class="col-12 {isLargeScreen ? 'col-lg-5' : ''}">
					{#each paginated as route}
						<div
							class="route-card d-flex align-items-center justify-content-between p-3 rounded-4 mb-2"
							role="button"
							tabindex="0"
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
											<span class="meta-sep">–</span>
											<span class="meta-time">{route.endingTime}</span>
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

					{#if paginated.length === 0}
						<EmptyData message="No Routes found" />
					{/if}
					{#if paginated.length > 0}
						<!-- Pagination -->
						<Pagination
							totalItems={filtered.length}
							{itemsPerPage}
							{currentPage}
							onPageChange={handlePageChange}
						/>
					{/if}
				</div>

				<!-- Right column: map preview (only on large screens) -->
				{#if isLargeScreen && showMap}
					<div class="col-12 col-lg-7">
						<RouteMapView {landmarks} />
					</div>
				{/if}

				<!-- Floating Map Button (only on small/medium screens) -->
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

	.route-card.selected {
		border: 2px solid var(--home-button-bg);
		box-shadow: 0 4px 18px rgba(27, 126, 207, 0.12);
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

	:global(.route-detail-sidebar-override .sidebar) {
		width: 600px !important;
		max-width: 100vw;
	}
</style>
