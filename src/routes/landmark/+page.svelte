<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import { landmarks, busStops } from '$lib/dummy-data';
	import type { Landmark } from '$lib/types/type';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import MapPreview from '$lib/components/landmark-busstop-components/MapPreview.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import CreationForm from '$lib/components/CreationForm.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import type { DetailConfig } from '$lib/types/detail-config';
	import DynamicDetailSidebar from '$lib/components/DynamicDetailSidebar.svelte';
	import { getLandmarkDetailConfig } from '$lib/configs/landmark-detail.config';
	import {
		DESKTOP_BREAKPOINT,
		LANDMARK_TYPE,
		LANDMARK_TYPE_FILTER_OPTIONS,
		LANDMARK_TYPE_VALUE_BY_LABEL,
		LANDMARK_TYPE_LABEL_BY_VALUE
	} from '$lib/constants';
	import { fetchLandmarkList } from '$lib/services/landmark';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { mapLandmarkTypeToLabel, titleCase } from '$lib/helpers';

	let selected: Landmark | null = null;
	let showDetail = false;
	let detailConfig: DetailConfig | null = null;

	//-- Open Detail Sidebar --
	function openDetail(row: Landmark) {
		selected = row;
		detailConfig = getLandmarkDetailConfig(row);
		showDetail = true;
	}

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;
	let hasNextPage = false;

	//-- request id to prevent stale response race conditions --
	let requestId = 0;

	let formattedLandmarkData: Landmark[] = [];
	let totalItems = 0;
	let loading = false;

	let boundary: string | null = null;

	//-- Map visibility states --
	let showMap = false;
	let isLargeScreen = false;

	//-- Fetch landmarks from API with current search, filters, and pagination --
	async function fetchLandmarks() {
		const currentRequestId = ++requestId;
		loading = true;
		hasNextPage = false;
		totalItems = 0;
		try {
			const typeFilter =
				activeFilters.type && !String(activeFilters.type).toLowerCase().startsWith('all')
					? LANDMARK_TYPE_VALUE_BY_LABEL[String(activeFilters.type)]
					: undefined;

			const apiData = await fetchLandmarkList({
				search: searchTerm,
				type: typeFilter,
				limit: itemsPerPage,
				offset: (currentPage - 1) * itemsPerPage
			});

			if (currentRequestId !== requestId) return; //-- stale response, discard --

			formattedLandmarkData = Array.isArray(apiData)
				? apiData.map((item: any) => ({
						id: item.id ? `LM-${item.id}` : '',
						apiId: item.id ?? null,
						name: item.name ?? '',
						boundary: item.boundary ?? '',
						type: titleCase(mapLandmarkTypeToLabel(item.type)),
						createdAt: item.created_on ?? item.createdAt ?? '',
						updatedAt: item.updated_on ?? item.updatedAt ?? ''
					}))
				: [];

			const apiTotal = (apiData as any)?.total;
			if (typeof apiTotal === 'number' && !Number.isNaN(apiTotal)) {
				totalItems = apiTotal;
				const fetchedCount = (currentPage - 1) * itemsPerPage + formattedLandmarkData.length;
				hasNextPage = fetchedCount < apiTotal;
			} else if (Array.isArray(apiData)) {
				const fetchedCount = (currentPage - 1) * itemsPerPage + apiData.length;

				if (apiData.length === 0 && currentPage > 1) {
					currentPage = Math.max(1, currentPage - 1);
					return await fetchLandmarks();
				}

				hasNextPage = apiData.length === itemsPerPage;
				totalItems = hasNextPage ? fetchedCount + 1 : fetchedCount;
			} else {
				totalItems = 0;
				hasNextPage = false;
			}
		} catch (e) {
			if (currentRequestId !== requestId) return; //-- stale error, discard --
			formattedLandmarkData = [];
			totalItems = 0;
			hasNextPage = false;
			const message = await handleApiError(e);
			toast.error(message || 'Failed to fetch landmarks.');
		}
		loading = false;
	}

	//-- Handle page change from Pagination component --
	function handlePageChange(p: number) {
		currentPage = p;
		fetchLandmarks();
	}

	//-- Search/Filter setup --
	let searchTerm = '';
	let activeFilters: Record<string, string> = {};
	const filters = [
		{
			label: 'Type',
			key: 'type',
			options: LANDMARK_TYPE_FILTER_OPTIONS
		}
	];

	//-- Handle search/filter updates --
	function handleSearchAndFilterUpdate(event: CustomEvent) {
		searchTerm = event.detail?.searchTerm ?? '';
		activeFilters = event.detail?.activeFilters ?? {};
		currentPage = 1;
		fetchLandmarks();
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
		fetchLandmarks();
	});

	//-- Cleanup resize listener --
	onDestroy(() => {
		if (browser) {
			window.removeEventListener('resize', checkScreenSize);
		}
	});

	//-- Add Landmark --
	let showModal = false;
	let selectedLandmarkId: string | null = null;
	const landmarkFields = [
		{
			name: 'boundary',
			label: 'Boundary WKT',
			placeholder: 'Enter landmark boundary in WKT format',
			required: true,
			fullWidth: true,
			readonly: true
		},
		{
			name: 'name',
			label: 'Name',
			placeholder: 'Enter landmark name',
			required: true
		},
		{
			name: 'type',
			required: true,
			label: 'Type',
			options: ['Local', 'Village', 'District', 'State', 'National'],
			placeholder: 'Select type'
		}
	];

	function handleAddLandmark() {
		showModal = true;
	}
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
				title="Landmark Management"
				subtitle="View and manage all landmarks"
				buttonLabel="Add Landmark"
				icon="bi-plus-lg"
				isInitiallyEnabled={!!boundary}
				showButton={!!boundary}
				disabledTooltip="Draw a landmark using the pencil tool to enable the button."
				onButtonClick={handleAddLandmark}
			/>

			<!-- SEARCH & FILTER BAR -->
			<SearchFilterBar
				searchPlaceholder="Search by name, ID, type..."
				{filters}
				on:update={handleSearchAndFilterUpdate}
			/>

			<!-- Map overlay for small screens -->
			{#if !isLargeScreen && showMap}
				<div class="map-overlay">
					<div class="map-overlay-header">
						<h5 class="fw-inter-700" style="color: var(--text-primary);">Landmark Map</h5>
						<button class="btn btn-sm btn-outline-secondary" aria-label="Close" on:click={closeMap}>
							<i class="bi bi-x-lg"></i>
						</button>
					</div>
					<div class="map-overlay-content position-relative">
						<MapPreview
							bind:boundary
							{landmarks}
							{busStops}
							bind:selectedLandmarkId
							on:addLandmark={handleAddLandmark}
						/>
						<!-- Floating Add Button inside map overlay -->
						<div class="floating-add-btn-overlay">
							<FloatingAddButton
								isInitiallyEnabled={!!boundary}
								showButton={!!boundary}
								onClick={handleAddLandmark}
							/>
						</div>
					</div>
				</div>
			{/if}

			<div class="landmark-layout row g-4">
				<!-- Left column: list -->
				<div class="col-12 {isLargeScreen ? 'col-lg-5' : ''}">
					{#each formattedLandmarkData as landmark}
						<div
							class="landmark-card d-flex align-items-center justify-content-between mb-3"
							role="button"
							tabindex="0"
							on:click={() => openDetail(landmark)}
							on:keydown={(e) => e.key === 'Enter' && openDetail(landmark)}
							class:selected={selectedLandmarkId === landmark.id}
						>
							<!-- Left section -->
							<div class="d-flex align-items-center gap-3">
								<!-- Icon -->
								<div class="landmark-icon">
									<i class="bi bi-geo-alt-fill"></i>
								</div>

								<!-- Info -->
								<div class="landmark-info">
									<div class="landmark-name fw-inter-700">
										{landmark.name}
									</div>
									<div class="landmark-id">{landmark.id}</div>
									<div>
										{#if !isLargeScreen}<span class="mobile-type">{landmark.type}</span>{/if}
									</div>
								</div>
							</div>

							<!-- Right section -->
							<div class="d-flex align-items-center gap-3">
								<span class="landmark-badge {landmark.type.toLowerCase()} fw-inter-600">
									{landmark.type}
								</span>
							</div>
						</div>
					{/each}

					{#if formattedLandmarkData.length === 0}
						<EmptyData message="No Landmarks found" />
					{/if}
					{#if formattedLandmarkData.length > 0}
						<!-- Pagination -->
						<Pagination
							totalItems={formattedLandmarkData.length}
							{itemsPerPage}
							{currentPage}
							onPageChange={handlePageChange}
						/>
					{/if}
				</div>

				<!-- Right column: map preview (only on large screens) -->
				{#if isLargeScreen && showMap}
					<div class="col-12 col-lg-7">
						<MapPreview
							bind:boundary
							{landmarks}
							{busStops}
							bind:selectedLandmarkId
							on:addLandmark={handleAddLandmark}
						/>
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
			{#if showDetail && detailConfig && selected}
				<div class="landmark-detail-sidebar-override">
					<DynamicDetailSidebar
						config={detailConfig}
						data={selected}
						sectionName="landmark"
						{landmarks}
						{busStops}
						on:close={() => (showDetail = false)}
						onDelete={() => {
							if (selected) {
								console.log('Delete landmark:', selected);
							}
						}}
						onSave={(updated: unknown) => {
							console.log('Save landmark:', updated);
						}}
					/>
				</div>
			{/if}

			<CreationForm
				bind:open={showModal}
				fields={landmarkFields}
				values={{ boundary: boundary ?? '' }}
				title="Add New Landmark"
				titleIcon="bi bi-geo-alt-fill"
				on:close={() => (showModal = false)}
			/>
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
	.landmark-card {
		background: var(--bg-card);
		padding: 0.75rem 1rem;
		border-radius: 1rem;
		cursor: pointer;
		transition:
			box-shadow 0.2s ease,
			transform 0.1s ease;
	}

	.landmark-card:hover {
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
		transform: translateY(-1px);
	}

	.landmark-icon {
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

	.landmark-name,
	.landmark-id {
		color: var(--text-primary);
	}

	@media (max-width: 768px) {
		.landmark-card {
			padding: 0.75rem 1rem;
			border-radius: 0.85rem;
		}

		.landmark-icon {
			width: 40px;
			height: 40px;
			border-radius: 10px;
			font-size: 1rem;
		}

		.landmark-name {
			font-size: 0.95rem;
		}
		.landmark-id {
			font-size: 0.75rem;
		}

		.landmark-badge {
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
		.landmark-card {
			padding: 0.5rem 0.75rem;
		}
		.landmark-icon {
			width: 36px;
			height: 36px;
			font-size: 0.95rem;
		}
		.landmark-name {
			font-size: 0.9rem;
		}
		.landmark-id {
			font-size: 0.7rem;
		}
		.landmark-badge {
			min-width: 50px;
		}
	}

	.landmark-badge {
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

	.landmark-card.selected {
		border: 2px solid var(--accent, #00b3a4);
		box-shadow: 0 8px 24px rgba(0, 179, 164, 0.14);
		transform: translateY(-2px);
	}

	.landmark-card.selected .landmark-icon {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) inset;
	}

	@media (max-width: 1024px) {
		.landmark-card > .d-flex:last-child .landmark-badge {
			display: none;
		}

		.mobile-type {
			color: var(--text-secondary, #6b7280);
			font-size: 0.9rem;
			font-weight: 500;
			display: inline;
		}

		.landmark-card {
			flex-wrap: nowrap;
			align-items: center;
		}

		.detail-btn {
			width: 32px;
			height: 32px;
		}
	}
	:global(.landmark-detail-sidebar-override .sidebar) {
		width: 600px !important;
		max-width: 100vw;
	}
</style>
