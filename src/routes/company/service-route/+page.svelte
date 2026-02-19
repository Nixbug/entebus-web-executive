<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import { applySearchAndFilters } from '$lib/helpers';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import { routes, busStops, landmarks } from '$lib/dummy-data';
	import type { Route } from '$lib/types/type';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import MapPreview from '$lib/components/landmark-busstop-components/MapPreview.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import CreationForm from '$lib/components/CreationForm.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { DESKTOP_BREAKPOINT } from '$lib/constants';

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;

	let boundary: string | null = null;
	let filtered = [...routes];
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
		filtered = applySearchAndFilters(routes, searchTerm, {
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
			<HomeButton />
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
						<MapPreview bind:boundary {landmarks} {busStops} />
						<!-- Floating Add Button inside map overlay -->
						<div class="floating-add-btn-overlay">
							<FloatingAddButton isInitiallyEnabled={!!boundary} showButton={!!boundary} />
						</div>
					</div>
				</div>
			{/if}

			<div class="route-layout row g-4">
				<!-- Left column: list -->
				<div class="col-12 {isLargeScreen ? 'col-lg-5' : ''}">
					{#each paginated as route}
						<div
							class="route-card d-flex align-items-center justify-content-between mb-3"
							role="button"
							tabindex="0"
						>
							<!-- Left section -->
							<div class="d-flex align-items-center gap-3">
								<!-- Icon -->
								<div class="route-icon">
									<i class="bi bi-geo-alt-fill"></i>
								</div>

								<!-- Info -->
								<div class="route-info">
									<div class="route-name fw-inter-700">
										{route.name}
									</div>
									<div class="route-id">{route.id}</div>
									<div>
										{#if !isLargeScreen}<span class="mobile-type">{route.status}</span>{/if}
									</div>
								</div>
							</div>

							<!-- Right section -->
							<div class="d-flex align-items-center gap-3">
								<span class="route-badge {route.status.toLowerCase()} fw-inter-600">
									{route.status}
								</span>
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
						<MapPreview bind:boundary {landmarks} {busStops} />
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
		background: var(--bg-card);
		padding: 0.75rem 1rem;
		border-radius: 1rem;
		cursor: pointer;
		transition:
			box-shadow 0.2s ease,
			transform 0.1s ease;
	}

	.route-card:hover {
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
		transform: translateY(-1px);
	}

	.route-icon {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: linear-gradient(135deg, #00b3a4, #00a0c6);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 1.1rem;
	}

	.detail-btn {
		width: 34px;
		height: 34px;
		padding: 0;
	}

	.route-name,
	.route-id {
		color: var(--text-primary);
	}

	@media (max-width: 768px) {
		.route-card {
			padding: 0.75rem 1rem;
			border-radius: 0.85rem;
		}

		.route-icon {
			width: 40px;
			height: 40px;
			border-radius: 10px;
			font-size: 1rem;
		}

		.route-name {
			font-size: 0.95rem;
		}
		.route-id {
			font-size: 0.75rem;
		}

		.route-badge {
			font-size: 0.58rem;
			padding: 0.22rem 0.5rem;
			min-width: 60px;
		}

		.detail-btn {
			width: 36px;
			height: 36px;
			padding: 0;
		}
	}

	@media (max-width: 480px) {
		.route-card {
			padding: 0.5rem 0.75rem;
		}
		.route-icon {
			width: 36px;
			height: 36px;
			font-size: 0.95rem;
		}
		.route-name {
			font-size: 0.9rem;
		}
		.route-id {
			font-size: 0.7rem;
		}
		.route-badge {
			min-width: 50px;
		}
	}

	.route-badge {
		font-size: 0.65rem;
		padding: 0.25rem 0.6rem;
		border-radius: 10px;
		white-space: nowrap;
		background-color: #00b3a4;
		color: white;
		min-width: 60px;
		text-align: center;
		display: inline-block;
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
		border-bottom: 1px solid var(--border-color);
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
		box-shadow: 0 6px 20px rgba(0, 179, 164, 0.3);
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

	.route-card.selected {
		border: 2px solid var(--accent, #00b3a4);
		box-shadow: 0 8px 24px rgba(0, 179, 164, 0.14);
		transform: translateY(-2px);
	}

	@media (max-width: 1024px) {
		.route-card > .d-flex:last-child .route-badge {
			display: none;
		}

		.mobile-type {
			color: var(--text-secondary, #6b7280);
			font-size: 0.9rem;
			font-weight: 500;
			display: inline;
		}

		.route-card {
			flex-wrap: nowrap;
			align-items: center;
		}

		.detail-btn {
			width: 32px;
			height: 32px;
		}
	}
	:global(.route-detail-sidebar-override .sidebar) {
		width: 600px !important;
		max-width: 100vw;
	}
</style>
