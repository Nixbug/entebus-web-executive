<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
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
		LANDMARK_TYPE_VALUE_BY_LABEL
	} from '$lib/constants';
	import {
		fetchLandmarkList,
		createLandmark,
		updateLandmark,
		deleteLandmark,
		type UpdateLandmarkRequest
	} from '$lib/services/landmark';
	import { fetchLandmarkInRoute } from '$lib/services/route-landmarks';
	import {
		fetchBusStopByLandmark,
		type FetchBusStopListResponse,
		deleteBusStop,
		createBusStop,
		updateBusStop,
		type CreateBusStopRequest,
		type UpdateBusStopRequest
	} from '$lib/services/bus-stop';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { mapLandmarkTypeToLabel, titleCase } from '$lib/helpers';
	import { landmarkSchema } from '$lib/schemas';
	import {
		canCreateLandmark,
		canDeleteLandmark,
		canUpdateLandmark,
		canCreateBusStop,
		canUpdateBusStop,
		canDeleteBusStop
	} from '$lib/utils/permissions';

	let selected: Landmark | null = null;
	let showDetail = false;
	let detailConfig: DetailConfig | null = null;
	let busStops: FetchBusStopListResponse = [];
	let busStopRequestId = 0;

	//-- Open Detail Sidebar --
	async function openDetail(row: Landmark) {
		selected = row;
		detailConfig = getLandmarkDetailConfig(row);
		busStops = [];
		showDetail = true;
		const currentBusStopRequestId = ++busStopRequestId;

		if (row.apiId != null) {
			try {
				const fetchedBusStops = await fetchBusStopByLandmark([row.apiId]);
				if (currentBusStopRequestId !== busStopRequestId) return;
				busStops = fetchedBusStops;
			} catch (e) {
				if (currentBusStopRequestId !== busStopRequestId) return;
				const message = await handleApiError(e);
				toast.error(message || 'Failed to fetch bus stops.');
				busStops = [];
			}
		}
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

	//-- Map landmarks (fetched by viewport location) --
	let mapLandmarks: Landmark[] = [];
	let mapRequestId = 0;
	let viewChangedTimer: ReturnType<typeof setTimeout> | null = null;
	const MAP_DEBOUNCE_MS = 500;

	//-- Map visibility states --
	let showMap = false;
	let isLargeScreen = false;

	//-- Map API landmark item to UI Landmark row format --
	function toLandmarkRow(item: any): Landmark {
		return {
			id: item.id ? `LAN-${item.id}` : '',
			apiId: item.id ?? null,
			name: item.name ?? '',
			boundary: item.boundary ?? '',
			type: titleCase(mapLandmarkTypeToLabel(item.type)),
			createdAt: item.created_on ?? item.createdAt ?? '',
			updatedAt: item.updated_on ?? item.updatedAt ?? ''
		};
	}

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
				type_list: typeFilter ? [typeFilter] : undefined,
				limit: itemsPerPage,
				offset: (currentPage - 1) * itemsPerPage
			});
			if (currentRequestId !== requestId) return; //-- stale response, discard --

			formattedLandmarkData = Array.isArray(apiData) ? apiData.map(toLandmarkRow) : [];
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
		} finally {
			loading = false;
		}
	}

	//-- Fetch landmarks visible near the current map center --
	async function fetchMapLandmarks(location: string, zoom: number) {
		const currentMapRequestId = ++mapRequestId;
		const limit = Math.min(100, Math.max(20, Math.floor(zoom * 5)));
		try {
			const apiData = await fetchLandmarkList({
				location,
				limit,
				order_by: 'location',
				order_in: 'asc'
			});
			if (currentMapRequestId !== mapRequestId) return;
			mapLandmarks = Array.isArray(apiData) ? apiData.map(toLandmarkRow) : [];
		} catch {
			if (currentMapRequestId !== mapRequestId) return;
			//-- silently ignore map viewport fetch errors to avoid spamming toasts --
		}
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

	//-- Handle map viewport change (debounced) --
	function handleViewChanged(event: CustomEvent<{ location: string; zoom: number }>) {
		if (viewChangedTimer) clearTimeout(viewChangedTimer);
		viewChangedTimer = setTimeout(() => {
			fetchMapLandmarks(event.detail.location, event.detail.zoom);
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

	//-- Cleanup resize listener and debounce timer --
	onDestroy(() => {
		if (browser) {
			window.removeEventListener('resize', checkScreenSize);
		}
		if (viewChangedTimer) clearTimeout(viewChangedTimer);
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
			label: 'Type',
			options: ['Local', 'Village', 'District', 'State', 'National'],
			placeholder: 'Select type'
		}
	];

	function handleAddLandmark() {
		if (!canCreateLandmark()) {
			toast.error('You do not have permission to add landmarks.');
			return;
		}
		showModal = true;
	}

	//-- Submit landmark creation form --
	async function handleSubmitLandmarkCreate(event: CustomEvent) {
		if (!canCreateLandmark()) {
			toast.error('You do not have permission to add landmarks.');
			return;
		}

		const formData = event.detail;
		try {
			const payload = {
				name: formData.name,
				boundary: formData.boundary,
				type:
					LANDMARK_TYPE_VALUE_BY_LABEL[formData.type] !== undefined
						? LANDMARK_TYPE_VALUE_BY_LABEL[formData.type]
						: LANDMARK_TYPE.LOCAL
			};

			await createLandmark(payload);
			toast.success('Landmark created successfully!');
			showModal = false;
			boundary = null;
			currentPage = 1;
			await fetchLandmarks();
		} catch (e) {
			const message = await handleApiError(e);
			toast.error(message || 'Failed to create landmark.');
		}
	}

	//-- Create bus stop --
	async function handleCreateBusStop(busStopData: CreateBusStopRequest): Promise<boolean> {
		if (!canCreateBusStop()) {
			toast.error('You do not have permission to create bus stops.');
			return false;
		}
		// Normalize landmark id from the typed request to a proper number.
		const normalizedLandmarkId = Number(
			(busStopData as any)?.landmark_id ?? (busStopData as any)?.landmarkId ?? null
		);
		const createdForLandmarkId =
			Number.isFinite(normalizedLandmarkId) && normalizedLandmarkId > 0
				? normalizedLandmarkId
				: null;
		try {
			await createBusStop(busStopData);
			toast.success('Bus stop created successfully.');
			//-- Refresh bus stops for the landmark this bus stop was created for --
			if (createdForLandmarkId != null) {
				const freshBusStops = await fetchBusStopByLandmark(createdForLandmarkId);
				if (selected && selected.apiId === createdForLandmarkId) {
					busStops = freshBusStops;
				}
			}
			return true;
		} catch (e: any) {
			const message = await handleApiError(e);
			toast.error(message || 'Failed to create bus stop.');
			return false;
		}
	}

	//-- Delete bus stop --
	async function handleDeleteBusStop(busStopId: string | number): Promise<boolean> {
		if (busStopId == null) {
			toast.error('Unable to determine bus stop id');
			return false;
		}
		const id = Number(busStopId);
		if (!Number.isFinite(id) || id <= 0) {
			toast.error('Unable to determine bus stop id');
			return false;
		}
		try {
			await deleteBusStop(id);
			toast.success('Bus stop deleted successfully.');
			busStops = busStops.filter((bs: any) => Number(bs.id) !== id);
			return true;
		} catch (e: any) {
			const message = await handleApiError(e);
			toast.error(message || 'Failed to delete bus stop.');
			return false;
		}
	}

	//-- Update bus stop --
	async function handleUpdateBusStop(
		busStopId: string | number,
		payload: UpdateBusStopRequest
	): Promise<boolean> {
		if (busStopId == null) {
			toast.error('Unable to determine bus stop id');
			return false;
		}
		const id = Number(busStopId);
		if (!Number.isFinite(id) || id <= 0) {
			toast.error('Unable to determine bus stop id');
			return false;
		}
		if (!canUpdateBusStop()) {
			toast.error('You do not have permission to update bus stops.');
			return false;
		}
		const selectedId = selected?.apiId != null ? Number(selected.apiId) : null;
		try {
			await updateBusStop(id, payload);
			toast.success('Bus stop updated successfully.');
			//-- Refresh bus stops for the landmark that was selected when the update started --
			if (selectedId != null && Number.isFinite(selectedId) && selectedId > 0) {
				const freshBusStops = await fetchBusStopByLandmark(selectedId);
				if (selected?.apiId != null && Number(selected.apiId) === selectedId) {
					busStops = freshBusStops;
				}
			}
			return true;
		} catch (e: any) {
			const message = await handleApiError(e);
			toast.error(message || 'Failed to update bus stop.');
			return false;
		}
	}

	//-- confirm Delete landmark --
	async function handleDeleteSelectedLandmark() {
		if (!selected) return false;
		try {
			const apiId = selected.apiId;
			if (apiId == null) {
				toast.error('Unable to determine landmark id');
				return false;
			}
			const id = Number(apiId);
			if (!Number.isFinite(id) || id <= 0) {
				toast.error('Unable to determine landmark id');
				return false;
			}
			try {
				const assigned = await fetchLandmarkInRoute({ landmark_id: id});
				const hasAssignment = Array.isArray(assigned)
					? assigned.length > 0
					: Boolean((assigned as any) && (assigned as any).length > 0);
				if (hasAssignment) {
					toast.error('Landmark is assigned to a route, so it cannot be deleted.');
					return false;
				}
			} catch (e: any) {
				const message = await handleApiError(e);
				toast.error(message || 'Failed to verify landmark route assignment.');
				return false;
			}

			await deleteLandmark(id);
			toast.success('Landmark deleted successfully.');
			showDetail = false;
			selected = null;
			await fetchLandmarks();
			return true;
		} catch (e: any) {
			const message = await handleApiError(e);
			toast.error(message || 'Failed to delete landmark.');
			return false;
		}
	}

	//-- Update landmark --
	async function handleUpdateSelectedLandmark(updated: unknown) {
		if (!selected) return false;
		if (!canUpdateLandmark()) {
			toast.error('You do not have permission to update landmarks.');
			return false;
		}
		try {
			const apiId = selected.apiId;
			if (apiId == null) {
				toast.error('Unable to determine landmark id');
				return false;
			}
			const id = Number(apiId);
			if (!Number.isFinite(id) || id <= 0) {
				toast.error('Unable to determine landmark id');
				return false;
			}

			const formData = updated as Record<string, any>;
			const payload: UpdateLandmarkRequest = {
				name: formData.name,
				boundary: formData.boundary,
				type:
					LANDMARK_TYPE_VALUE_BY_LABEL[formData.type] !== undefined
						? LANDMARK_TYPE_VALUE_BY_LABEL[formData.type]
						: LANDMARK_TYPE.LOCAL
			};

			await updateLandmark(id, payload);
			toast.success('Landmark updated successfully.');
			showDetail = false;
			selected = null;
			await fetchLandmarks();
			return true;
		} catch (e: any) {
			const message = await handleApiError(e);
			if (message === 'Landmark centroid movement exceeds allowed limit') {
				toast.error('You cannot move the landmark too far from its original location.');
			} else {
				toast.error(message || 'Failed to update landmark.');
			}
			return false;
		}
	}
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
			<HomeButton />
			<!-- PAGE HEADER -->
			<ListingPageHeader
				title="Landmark Management"
				subtitle="View and manage all landmarks"
				buttonLabel="Add Landmark"
				icon="bi-plus-lg"
				isInitiallyEnabled={!!boundary && canCreateLandmark()}
				showButton={!!boundary}
				disabledTooltip="You do not have permission to add landmarks."
				onButtonClick={handleAddLandmark}
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
						<h5 class="fw-inter-700" style="color: var(--text-primary);">Landmark Map</h5>
						<button class="btn btn-sm btn-outline-secondary" aria-label="Close" on:click={closeMap}>
							<i class="bi bi-x-lg"></i>
						</button>
					</div>
					<div class="map-overlay-content position-relative">
						<MapPreview
							bind:boundary
							landmarks={selected ? [selected, ...mapLandmarks] : mapLandmarks}
							{busStops}
							bind:selectedLandmarkId
							autoFitLandmarks={false}
							on:addLandmark={handleAddLandmark}
							on:viewChanged={handleViewChanged}
						/>
						<!-- Floating Add Button inside map overlay -->
						<div class="floating-add-btn-overlay">
							<FloatingAddButton
								isInitiallyEnabled={!!boundary && canCreateLandmark()}
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
										{titleCase(landmark.name)}
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

					{#if !loading && formattedLandmarkData.length === 0}
						<EmptyData message="No Landmarks found" />
					{/if}
					{#if totalItems > 0 || hasNextPage}
						<!-- Pagination -->
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
						<MapPreview
							bind:boundary
							landmarks={selected ? [selected, ...mapLandmarks] : mapLandmarks}
							{busStops}
							bind:selectedLandmarkId
							autoFitLandmarks={false}
							on:addLandmark={handleAddLandmark}
							on:viewChanged={handleViewChanged}
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
						landmarks={formattedLandmarkData}
						{busStops}
						on:close={() => (showDetail = false)}
						hasDeletePermission={canDeleteLandmark()}
						hasUpdatePermission={canUpdateLandmark()}
						onDelete={handleDeleteSelectedLandmark}
						onSave={handleUpdateSelectedLandmark}
						hasBusStopDeletePermission={canDeleteBusStop()}
						hasBusStopEditPermission={canUpdateBusStop()}
						hasBusStopCreatePermission={canCreateBusStop()}
						onDeleteBusStop={handleDeleteBusStop}
						onCreateBusStop={handleCreateBusStop}
						onUpdateBusStop={handleUpdateBusStop}
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
				schema={landmarkSchema}
				on:submit={handleSubmitLandmarkCreate}
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
