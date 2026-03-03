<script lang="ts">
	import EmptyData from '$lib/components/EmptyData.svelte';
	import RouteMapView from '$lib/components/route-components/RouteMapView.svelte';
	import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';
	import LandmarkFormModal from '$lib/components/route-components/LandmarkFormModal.svelte';
	import TimeSelector from '$lib/components/route-components/TimeSelector.svelte';
	import type { TimeSelection } from '$lib/types/type';
	import { createEventDispatcher } from 'svelte';

	//-- Props --
	export let route: any = null;
	export let resolvedLandmarks: any[] = [];
	export let landmarks: any[] = [];
	export let mapCenter: { lat: number; lng: number } = { lat: 10.8505, lng: 76.2711 };
	export let routePathPoints: Array<{
		lon: number;
		lat: number;
		label: string;
		sequence: number;
		boundary?: string;
		landmarkId: string;
	}> = [];
	export let isLargeScreen: boolean = false;
	export let showMap: boolean = false;
	export let computeTime: (startingTime: string, deltaSeconds: number) => string;
	export let formatDistance: (distance: number) => string;

	//-- State --
	let showDeleteModal = false;
	let selectedLandmarkForDelete: any = null;
	let selectedLandmarkForEdit: any = null;
	let isLandmarkModalOpen: boolean = false;
	// route edit state
	let isEditingRoute = false;
	let editRouteName: string = '';
	let editStartingTime: TimeSelection = { days: 0, hours: 12, minutes: 0, period: 'AM' };

	//-- Events --
	const dispatch = createEventDispatcher();

	//-- Derived ending time: if backend doesn't provide `endingTime`, compute it
	// from the last landmark arrival delta relative to `startingTime`.
	let endingTimeComputed: string | null = null;
	$: if (route) {
		if (route.endingTime) {
			endingTimeComputed = route.endingTime;
		} else if (route.startingTime && resolvedLandmarks && resolvedLandmarks.length > 0) {
			// prefer sequence-based last landmark if available, otherwise max arrivalDelta
			const bySequence = [...resolvedLandmarks].sort(
				(a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)
			);
			const last = bySequence[bySequence.length - 1];
			const lastDelta = (last && (last.arrivalDelta ?? last.arrival_delta ?? last.arrival)) ?? null;
			const delta =
				typeof lastDelta === 'number'
					? lastDelta
					: Math.max(...resolvedLandmarks.map((l) => l.arrivalDelta ?? 0));
			endingTimeComputed = computeTime(route.startingTime, delta || 0);
		} else {
			// fallback to startingTime if nothing else
			endingTimeComputed = route.startingTime ?? null;
		}
	} else {
		endingTimeComputed = null;
	}

	function toggleMap() {
		dispatch('toggleMap');
	}

	function closeMap() {
		dispatch('closeMap');
	}

	function openDeleteModal() {
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
	}

	function confirmDeleteRoute() {
		dispatch('deleteRoute', { routeId: route.id });
		closeDeleteModal();
	}

	function openLandmarkDeleteModal(landmark: any) {
		selectedLandmarkForDelete = landmark;
	}

	function closeLandmarkDeleteModal() {
		selectedLandmarkForDelete = null;
	}

	function confirmDeleteLandmark() {
		dispatch('deleteLandmark', {
			routeId: route.id,
			landmarkId: selectedLandmarkForDelete.id,
			landmarkName: selectedLandmarkForDelete.landmarkName
		});
		closeLandmarkDeleteModal();
	}

	function openLandmarkEditModal(landmark: any) {
		selectedLandmarkForEdit = landmark;
		isLandmarkModalOpen = true;
	}

	function openRouteEdit() {
		if (!route) return;
		isEditingRoute = true;
		editRouteName = route.name || '';
		// parse startingTime to TimeSelection (basic parser)
		editStartingTime = parseStartingTimeToSelection(route.startingTime);
	}

	function cancelRouteEdit() {
		isEditingRoute = false;
	}

	function saveRouteEdit() {
		const formatted = formatTimeSelection(editStartingTime);
		dispatch('editRoute', { routeId: route.id, name: editRouteName, startingTime: formatted });
		isEditingRoute = false;
	}

	function parseStartingTimeToSelection(s: string | undefined): TimeSelection {
		if (!s) return { days: 0, hours: 12, minutes: 0, period: 'AM' };
		const m = String(s).match(/(\d{1,2})[:.](\d{2})\s*(AM|PM)?/i);
		if (!m) return { days: 0, hours: 12, minutes: 0, period: 'AM' };
		let hours = parseInt(m[1]);
		const minutes = parseInt(m[2]);
		const period = (m[3] ? m[3].toUpperCase() : hours >= 12 ? 'PM' : 'AM') as 'AM' | 'PM';
		if (hours === 0) hours = 12;
		if (hours > 12) hours = hours % 12;
		return { days: 0, hours, minutes, period };
	}

	function formatTimeSelection(t: TimeSelection) {
		const hh = String(t.hours ?? 12).padStart(2, '0');
		const mm = String(t.minutes ?? 0).padStart(2, '0');
		const p = (t.period ?? 'AM') as 'AM' | 'PM';
		return `${hh}:${mm} ${p}`;
	}

	function closeLandmarkEditModal() {
		selectedLandmarkForEdit = null;
		isLandmarkModalOpen = false;
	}

	function handleLandmarkModalSave(event: any) {
		const { detail } = event;
		dispatch('editLandmark', {
			routeId: route.id,
			...detail
		});
		closeLandmarkEditModal();
	}
</script>

<div class="route-detail-wrapper">
	{#if showDeleteModal}
		<DeleteConfirmationModal
			id={route.id}
			name={route.name}
			sectionName="route"
			onConfirm={confirmDeleteRoute}
			onCancel={closeDeleteModal}
		/>
	{/if}

	{#if selectedLandmarkForDelete}
		<DeleteConfirmationModal
			id={selectedLandmarkForDelete.id}
			name={selectedLandmarkForDelete.landmarkName}
			sectionName="landmark"
			onConfirm={confirmDeleteLandmark}
			onCancel={closeLandmarkDeleteModal}
		/>
	{/if}

	<LandmarkFormModal
		landmark={selectedLandmarkForEdit}
		isOpen={isLandmarkModalOpen}
		mode="edit"
		startingTime={route?.startingTime}
		on:save={handleLandmarkModalSave}
		on:close={closeLandmarkEditModal}
	/>

	{#if route}

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
					<RouteMapView {landmarks} center={mapCenter} routePath={routePathPoints} />
				</div>
			</div>
		{/if}

		<!-- MAIN LAYOUT: Left landmarks + Right map -->
		<div class="detail-layout row g-4">
			<!-- Left column: Landmark timeline -->
			<div class="col-12 {isLargeScreen ? 'col-lg-5' : ''}">
				<!-- ROUTE HEADER (placed inside left column so it aligns with landmarks/map) -->
				<div class="route-header-card rounded-4 mb-3">
					<div class="route-header-top d-flex align-items-start justify-content-between">
						<div class="d-flex align-items-center gap-3 route-header-left">
							<div>
								<div class="d-flex align-items-center gap-2 flex-wrap">
									<h4 class="fw-inter-700 mb-0 route-title">{route.name}</h4>
									<span class="route-status-badge {route.status.toLowerCase()} fw-inter-600">
										{route.status}
									</span>
								</div>

								{#if isEditingRoute}
									<!-- Route Edit Modal: edit only name and starting time -->
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<div
										class="modal-overlay"
										role="button"
										tabindex="0"
										aria-label="Close modal"
										on:click={cancelRouteEdit}
									>
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div class="modal-content" on:click|stopPropagation>
											<div class="modal-header d-flex align-items-center justify-content-between">
												<h5 class="fw-inter-700 mb-0" style="color: var(--text-primary); ">Edit Route</h5>
												<button class="btn-close" aria-label="Close" on:click={cancelRouteEdit}></button>
											</div>
											<div class="modal-body">
												<div class="form-group mb-3">
													<!-- svelte-ignore a11y_label_has_associated_control -->
													<label class="form-label fw-inter-600">Route Name</label>
													<input type="text" class="form-control" bind:value={editRouteName} />
												</div>
												<div class="form-group mb-3">
													<!-- svelte-ignore a11y_label_has_associated_control -->
													<label class="form-label fw-inter-600">Starting Time</label>
													<TimeSelector bind:value={editStartingTime} />
												</div>
											</div>
											<div class="modal-footer d-flex align-items-center justify-content-center gap-2">
												<button class="btn btn-secondary btn-wrapper" on:click={cancelRouteEdit}>Cancel</button>
												<button class="btn btn-primary btn-wrapper" on:click={saveRouteEdit}>Save</button>
											</div>
										</div>
									</div>
								{/if}
							</div>
						</div>
						<div class="route-action-btns d-flex gap-2 flex-shrink-0">
							{#if !isEditingRoute}
								<button class="icon-btn" title="Edit route" aria-label="Edit route" on:click={openRouteEdit}>
									<i class="bi bi-pencil-square"></i>
								</button>
								<button class="icon-btn delete" title="Delete route" aria-label="Delete route" on:click={openDeleteModal}>
									<i class="bi bi-trash3"></i>
								</button>
							{/if}
						</div>
					</div>
					<div class="route-header-meta mt-2 d-flex align-items-center gap-3 flex-wrap">
						<span class="route-header-id">
							<i class="bi bi-hash"></i>
							{route.id}
						</span>
						<span class="route-header-time">
							<i class="bi bi-clock"></i>
							{route.startingTime} – {endingTimeComputed}
						</span>
						<span class="route-header-landmarks">
							<i class="bi bi-geo-alt"></i>
							{resolvedLandmarks.length} Landmarks
						</span>
					</div>
				</div>

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
													on:click={() => openLandmarkEditModal(lm)}
												>
													<i class="bi bi-pencil-square"></i>
												</button>
												<button
													class="icon-btn delete"
													title="Remove landmark"
													aria-label="Remove landmark"
													on:click={() => openLandmarkDeleteModal(lm)}
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
										<div class="landmark-card-meta mt-2 d-flex align-items-center gap-2 flex-wrap">
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
</div>

<style>
	.route-detail-wrapper {
		width: 100%;
	}

	.route-header-card {
		background-color: var(--bg-card);
		border: 1px solid var(--border);
		padding: 1rem;
	}

	.route-header-top {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 1rem;
	}

	.route-header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.route-title {
		color: var(--text-primary);
		font-size: 1.15rem;
	}

	/* Modal styles for route edit modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		padding: 1rem;
	}

	.modal-content {
		background-color: var(--bg-card);
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		max-width: 520px;
		width: 100%;
		max-height: 90vh;
		border: 1px solid var(--border);
	}

	.modal-header {
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.modal-body {
		padding: 1rem 1.25rem;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--border);
		background-color: var(--bg-card);
	}

	.modal-footer .btn-wrapper {
		flex: 0 0 48%;
	}

	.modal-footer .btn {
		width: 100%;
	}

	.btn-close {
		background: none;
		border: none;
		font-size: 1.25rem;
		color: var(--text-muted);
		cursor: pointer;
	}

	.btn-close:hover {
		color: var(--text-primary);
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
		margin-top: 0.5rem;
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

	.route-action-btns {
		flex-shrink: 0;
	}

	.section-title {
		color: var(--text-primary);
		font-size: 0.95rem;
	}

	.landmark-timeline {
		position: relative;
		max-height: 670px;
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

	.landmark-card-header {
		display: flex;
		align-items: start;
		justify-content: space-between;
	}

	.landmark-name {
		color: var(--text-primary);
		font-size: 0.9rem;
		line-height: 1.3;
	}

	.landmark-card-meta {
		font-size: 0.78rem;
		color: var(--text-muted);
		margin-top: 0.5rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.meta-item i {
		font-size: 0.72rem;
	}

	.arrival-time,
	.departure-time {
		border-radius: 6px;
		display: inline-flex;
		align-items: center;
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
		.route-header-card {
			padding: 1rem !important;
		}

		.landmark-timeline {
			max-height: 670px;
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
			max-height: 670px;
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
	}
</style>
