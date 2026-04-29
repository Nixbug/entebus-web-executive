<script lang="ts">
	import EmptyData from '$lib/components/EmptyData.svelte';
	import RouteMapView from '$lib/components/route-components/RouteMapView.svelte';
	import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';
	import LandmarkFormModal from '$lib/components/route-components/LandmarkFormModal.svelte';
	import LandmarkInstructionsModal from '$lib/components/route-components/LandmarkInstructionsModal.svelte';
	import TimeSelector from '$lib/components/route-components/TimeSelector.svelte';
	import type { TimeSelection } from '$lib/types/type';
	import { parseStartingTime } from '$lib/helpers';
	import { routeSchema } from '$lib/schemas';
	import { createEventDispatcher } from 'svelte';
	import toast from '$lib/utils/toast';

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
	export let enableLandmarkClick: boolean = false;
	let effectiveEnableLandmarkClick: boolean = enableLandmarkClick;
	export let autoFitLandmarks: boolean = true;
	export let mode: 'detail' | 'create' = 'detail';
	export let isSubmitting: boolean = false;

	//-- State --
	let showDeleteModal = false;
	let selectedLandmarkForDelete: any = null;
	let selectedLandmarkForEdit: any = null;
	let isLandmarkModalOpen: boolean = false;
	let landmarkModalMode: 'edit' | 'create' = 'edit';
	let isEditingRoute = false;
	let isInstructionsOpen = false;
	let editRouteName: string = '';
	let editRouteNameError: string | null = null;
	let editStartingTime: TimeSelection = { days: 0, hours: 12, minutes: 0, period: 'AM' };
	export let hasDeletePermission: boolean = false;
	export let hasCreatePermission: boolean = false;
	export let hasUpdatePermission: boolean = false;
	export let disabledDeleteTooltip: string = 'You do not have permission to delete this item.';
	export let disabledUpdateTooltip: string = 'You do not have permission to update this item.';

	//-- Create mode: force editing; derive effective enable flag instead of overwriting prop --
	$: if (mode === 'create') isEditingRoute = true;
	$: effectiveEnableLandmarkClick = mode === 'create' ? !isSubmitting : enableLandmarkClick;

	//-- Effective starting time (edit form in create mode, route data in detail mode) --
	$: effectiveStartingTime =
		mode === 'create' ? formatTimeSelection(editStartingTime) : (route?.startingTime ?? '12:00 AM');

	//-- Events --
	const dispatch = createEventDispatcher();

	//-- Compute ending time + header day delta (single reactive) --
	let endingTimeComputed: string | null = null;
	let headerEndDelta: number | null = null;
	$: {
		//-- Compute ending time based on last landmark delta if route.endingTime is not set --
		let lastDeltaNum: number | null = null;
		if (resolvedLandmarks && resolvedLandmarks.length > 0) {
			const bySequence = [...resolvedLandmarks].sort(
				(a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)
			);
			const last = bySequence[bySequence.length - 1];
			const lastDelta = (last && (last.arrivalDelta ?? last.arrival_delta ?? last.arrival)) ?? null;
			lastDeltaNum =
				typeof lastDelta === 'number'
					? lastDelta
					: Math.max(...resolvedLandmarks.map((l) => l.arrivalDelta ?? 0));
		}

		if (mode === 'create') {
			endingTimeComputed =
				lastDeltaNum != null
					? computeTime(effectiveStartingTime, lastDeltaNum)
					: effectiveStartingTime;
			headerEndDelta = lastDeltaNum != null ? lastDeltaNum : null;
		} else if (route) {
			if (route.endingTime) {
				endingTimeComputed = route.endingTime;
				headerEndDelta = null;
			} else {
				endingTimeComputed =
					lastDeltaNum != null && route.startingTime
						? computeTime(route.startingTime, lastDeltaNum)
						: (route.startingTime ?? null);
				headerEndDelta = lastDeltaNum != null ? lastDeltaNum : null;
			}
		} else {
			endingTimeComputed = null;
			headerEndDelta = null;
		}
	}

	//-- toggle map visibility --
	function toggleMap() {
		dispatch('toggleMap');
	}

	//-- close map (for small screens) --
	function closeMap() {
		dispatch('closeMap');
	}

	//-- Modals --
	function openDeleteModal() {
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
	}

	function confirmDeleteRoute() {
		dispatch('deleteRoute', { routeId: route?.id });
		closeDeleteModal();
	}

	function openLandmarkDeleteModal(landmark: any) {
		if (isSubmitting) return;
		//-- In create mode, just remove the landmark without confirmation since it hasn't been saved yet --
		if (mode === 'create') {
			dispatch('deleteLandmark', {
				routeLandmarkId: landmark.id,
				landmarkName: landmark.landmarkName
			});
			return;
		}

		selectedLandmarkForDelete = landmark;
	}

	function closeLandmarkDeleteModal() {
		selectedLandmarkForDelete = null;
	}

	//-- Confirm delete landmark --
	function confirmDeleteLandmark() {
		dispatch('deleteLandmark', {
			routeId: route?.id ?? '',
			routeLandmarkId: selectedLandmarkForDelete.id,
			landmarkName: selectedLandmarkForDelete.landmarkName
		});
		closeLandmarkDeleteModal();
	}

	//-- Open edit modal for landmark --
	function openLandmarkEditModal(landmark: any) {
		if (isSubmitting) return;
		selectedLandmarkForEdit = landmark;
		isLandmarkModalOpen = true;
	}

	//-- open inline edit for route (name + starting time) --
	function openRouteEdit() {
		if (!route) return;
		isEditingRoute = true;
		editRouteName = route.name || '';
		editStartingTime = parseStartingTimeToSelection(route.startingTime);
	}

	//-- Cancel route edit --
	function cancelRouteEdit() {
		if (mode === 'create') {
			dispatch('cancelCreate');
		} else {
			isEditingRoute = false;
		}
	}

	//-- Save route edit (dispatch event with updated data) --
	function saveRouteEdit() {
		//-- Validate route name using routeSchema and show error if invalid --
		const validation = routeSchema.safeParse({ name: editRouteName });
		if (!validation.success) {
			editRouteNameError = validation.error.issues?.[0]?.message ?? 'Invalid route name';
			return;
		}
		if (resolvedLandmarks.length < 2) {
			toast.warning('A route must have at least 2 landmarks.');
			return;
		}
		const formatted = formatTimeSelection(editStartingTime);
		if (mode === 'create') {
			dispatch('createRoute', { name: editRouteName, startingTime: formatted });
		} else {
			dispatch('editRoute', { routeId: route.id, name: editRouteName, startingTime: formatted });
			isEditingRoute = false;
		}
	}

	//-- Helper to parse route starting time string into TimeSelection for TimeSelector component --
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

	//-- Helper to format TimeSelection back into string for dispatching editRoute event --
	function formatTimeSelection(t: TimeSelection) {
		const hh = String(t.hours ?? 12).padStart(2, '0');
		const mm = String(t.minutes ?? 0).padStart(2, '0');
		const p = (t.period ?? 'AM') as 'AM' | 'PM';
		return `${hh}:${mm} ${p}`;
	}

	//-- Handle landmark click from the map (open form modal in create mode) --
	function handleMapLandmarkClick(
		event: CustomEvent<{ landmarkId: string; landmarkName: string }>
	) {
		if (isSubmitting || !effectiveEnableLandmarkClick) return;
		const { landmarkId, landmarkName } = event.detail;
		//-- Find full landmark data from the landmarks array --
		const lm = landmarks.find((l: any) => (l.id || l._id) === landmarkId);
		selectedLandmarkForEdit = {
			landmarkId,
			landmarkName: landmarkName || lm?.name || '',
			boundary: lm?.boundary || null
		};
		landmarkModalMode = 'create';
		isLandmarkModalOpen = true;
	}

	//-- Close landmark edit modal --
	function closeLandmarkEditModal() {
		selectedLandmarkForEdit = null;
		isLandmarkModalOpen = false;
		landmarkModalMode = 'edit';
	}

	function openInstructionsModal() {
		isInstructionsOpen = true;
	}

	function closeInstructionsModal() {
		isInstructionsOpen = false;
	}

	//-- Handle save from landmark edit/create modal and dispatch appropriate event --
	function handleLandmarkModalSave(event: any) {
		const { detail } = event;
		if (landmarkModalMode === 'create') {
			dispatch('addLandmark', {
				routeId: route?.id ?? '',
				...detail
			});
		} else {
			dispatch('editLandmark', {
				routeId: route?.id ?? '',
				...detail
			});
		}
		closeLandmarkEditModal();
	}

	//-- Return a day label like '(D1)', computed from starting time + delta seconds --
	function getDayLabel(startingTime: string, deltaSeconds: number | undefined): string {
		try {
			const baseSeconds = parseStartingTime(startingTime || '') * 60;
			const total = baseSeconds + (deltaSeconds || 0);
			const day = Math.floor(total / 86400) + 1;
			return `(D${day})`;
		} catch (e) {
			return '';
		}
	}
</script>

<LandmarkInstructionsModal isOpen={isInstructionsOpen} on:close={closeInstructionsModal} />
<div class="route-detail-wrapper">
	{#if showDeleteModal && route}
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
		mode={landmarkModalMode}
		startingTime={effectiveStartingTime}
		isFirstLandmark={landmarkModalMode === 'create' && resolvedLandmarks.length === 0}
		existingLandmarks={resolvedLandmarks}
		on:save={handleLandmarkModalSave}
		on:close={closeLandmarkEditModal}
	/>

	{#if route || mode === 'create'}
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
						{landmarks}
						center={mapCenter}
						routePath={routePathPoints}
						enableLandmarkClick={effectiveEnableLandmarkClick}
						{autoFitLandmarks}
						on:landmarkClick={handleMapLandmarkClick}
						on:viewChanged
					/>
				</div>
			</div>
		{/if}

		<!-- MAIN LAYOUT: Left landmarks + Right map -->
		<div class="detail-layout row g-4">
			<!-- Left column: Landmark timeline -->
			<div class="col-12 {isLargeScreen ? 'col-lg-5' : ''}">
				<!-- ROUTE HEADER (placed inside left column so it aligns with landmarks/map) -->
				<div class="route-header-card rounded-4 mb-3" class:expanded={!isEditingRoute}>
					<div class="route-header-top d-flex align-items-start justify-content-between">
						<div class="d-flex align-items-center gap-3 route-header-left">
							<div>
								{#if !isEditingRoute}
									<div class="d-flex align-items-center gap-2 flex-wrap">
										<h4 class="fw-inter-700 mb-0 route-title">{route.name}</h4>
										<span class="route-status-badge {route.status.toLowerCase()} fw-inter-600">
											{route.status}
										</span>
									</div>
								{:else}
									<div class="edit-route-inline">
										{#if mode === 'create'}
											<div class="edit-header d-flex justify-content-end">
												<button
													class="icon-btn"
													title="Landmark rules"
													aria-label="Landmark rules"
													style="color: var(--error-color); border-color: var(--border);"
													on:click={openInstructionsModal}
												>
													<i class="bi bi-question-circle"></i>
												</button>
											</div>
										{/if}
										<div class="edit-row stacked">
											<label for="route-name" class="edit-label"
												>Route Name<span class="text-danger">*</span></label
											>
											<input
												id="route-name"
												class="form-control form-control-sm"
												bind:value={editRouteName}
												on:input={() => (editRouteNameError = null)}
												required
												placeholder="Enter route name"
											/>
											{#if editRouteNameError}
												<div class="text-danger small mt-1">{editRouteNameError}</div>
											{/if}
										</div>
										<div class="edit-row stacked">
											<label for="starting-time" class="edit-label"
												>Starting Time<span class="text-danger">*</span></label
											>
											<div class="time-wrap">
												<TimeSelector bind:value={editStartingTime} showDays={false} />
											</div>
										</div>
										<div class="edit-actions">
											<button class="cancel-btn btn btn-secondary btn-sm" on:click={cancelRouteEdit}
												>Cancel</button
											>
											<button
												class="save-btn btn btn-primary btn-sm"
												on:click={saveRouteEdit}
												disabled={isSubmitting}
											>
												{isSubmitting
													? mode === 'create'
														? 'Creating...'
														: 'Saving...'
													: mode === 'create'
														? 'Create Route'
														: 'Save'}
											</button>
										</div>
									</div>
								{/if}
							</div>
						</div>
						<div class="route-action-btns d-flex gap-2 flex-shrink-0">
							{#if !isEditingRoute}
								<span title={!hasUpdatePermission ? disabledUpdateTooltip : undefined}>
									<button
										class="icon-btn edit"
										class:disabled={!hasUpdatePermission}
										aria-label="Edit route"
										disabled={!hasUpdatePermission}
										on:click={openRouteEdit}
									>
										<i class="bi bi-pencil-square"></i>
									</button>
								</span>
								<span title={!hasDeletePermission ? disabledDeleteTooltip : undefined}>
									<button
										class="icon-btn delete"
										class:disabled={!hasDeletePermission}
										aria-label="Delete route"
										disabled={!hasDeletePermission}
										on:click={openDeleteModal}
									>
										<i class="bi bi-trash3"></i>
									</button>
								</span>
							{/if}
						</div>
					</div>
					{#if !isEditingRoute}
						<div class="route-header-meta mt-2 d-flex align-items-center gap-3 flex-wrap">
							<span class="route-header-id">
								<i class="bi bi-hash"></i>
								{route.id}
							</span>
							<span class="route-header-time">
								<i class="bi bi-clock"></i>
								{effectiveStartingTime}
								{getDayLabel(effectiveStartingTime, 0)} – {endingTimeComputed}
								{#if headerEndDelta !== null}
									<span class="text-muted">
										{getDayLabel(effectiveStartingTime, headerEndDelta)}</span
									>
								{/if}
							</span>
							<span class="route-header-landmarks">
								<i class="bi bi-geo-alt"></i>
								{resolvedLandmarks.length} Landmarks
							</span>
						</div>
					{/if}
				</div>

				<div class="landmarks-section">
					<div class="d-flex align-items-center justify-content-between mb-3">
						<h6 class="section-title fw-inter-700 mb-0">
							<i class="bi bi-signpost-2 me-2"></i>
							Route Landmarks
						</h6>
						{#if mode !== 'create'}
							<div class="edit-header d-flex justify-content-end">
								<button
									class="icon-btn"
									title="Landmark rules"
									aria-label="Landmark rules"
									style="color: var(--error-color); border-color: var(--border);"
									on:click={openInstructionsModal}
								>
									<i class="bi bi-question-circle"></i>
								</button>
							</div>
						{/if}
						{#if mode === 'create'}
							<span class="add-landmark-hint" style="font-size: 0.8rem;">
								Click a landmark on the map to add
							</span>
						{/if}
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
												{#if mode !== 'create' || hasUpdatePermission || hasCreatePermission}
													<button
														class="icon-btn edit"
														class:disabled={!hasUpdatePermission && !hasCreatePermission}
														title={!hasUpdatePermission && !hasCreatePermission
															? disabledUpdateTooltip
															: undefined}
														aria-label="Edit landmark"
														on:click={() =>
															(hasUpdatePermission || hasCreatePermission) &&
															openLandmarkEditModal(lm)}
														disabled={isSubmitting ||
															(!hasUpdatePermission && !hasCreatePermission)}
														aria-disabled={!hasUpdatePermission && !hasCreatePermission}
														tabindex={!hasUpdatePermission && !hasCreatePermission ? -1 : undefined}
													>
														<i class="bi bi-pencil-square"></i>
													</button>
												{/if}
												<button
													class:disabled={mode !== 'create' &&
														!hasUpdatePermission &&
														!hasCreatePermission}
													class="icon-btn delete"
													disabled={isSubmitting ||
														(mode !== 'create' && !hasUpdatePermission && !hasCreatePermission)}
													aria-label="Delete landmark"
													title={mode !== 'create' && !hasUpdatePermission && !hasCreatePermission
														? disabledDeleteTooltip
														: undefined}
													aria-disabled={mode !== 'create' &&
														!hasUpdatePermission &&
														!hasCreatePermission}
													tabindex={mode !== 'create' &&
													!hasUpdatePermission &&
													!hasCreatePermission
														? -1
														: undefined}
													on:click={() =>
														(mode === 'create' || hasUpdatePermission || hasCreatePermission) &&
														openLandmarkDeleteModal(lm)}
												>
													<i class="bi bi-trash3"></i>
												</button>
											</div>
										</div>
										<div class="landmark-card-meta d-flex align-items-center gap-2 flex-wrap">
											<span class="meta-item arrival-time" title="Arrival time">
												<i class="bi bi-arrow-down"></i>
												<strong>Arr:</strong>
												{computeTime(effectiveStartingTime, lm.arrivalDelta)}
												{getDayLabel(effectiveStartingTime, lm.arrivalDelta)}
											</span>

											<span class="meta-item departure-time" title="Departure time">
												<i class="bi bi-arrow-up"></i>
												<strong>Dep:</strong>
												{computeTime(effectiveStartingTime, lm.departureDelta)}
												{getDayLabel(effectiveStartingTime, lm.departureDelta)}
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
						<EmptyData message="No landmarks found" subtitle="Select a landmark from the map." />
					{/if}
				</div>
			</div>

			<!-- Right column: Map (large screens) -->
			{#if isLargeScreen && showMap}
				<div class="col-12 col-lg-7">
					<RouteMapView
						{landmarks}
						center={mapCenter}
						routePath={routePathPoints}
						enableLandmarkClick={effectiveEnableLandmarkClick}
						{autoFitLandmarks}
						on:landmarkClick={handleMapLandmarkClick}
						on:viewChanged
					/>
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
		<EmptyData message="Route not found" showSubtitle={false} />
	{/if}
</div>

<style>
	.route-detail-wrapper {
		width: 100%;
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
	.route-header-card {
		background-color: var(--bg-card);
		border: 1px solid var(--border);
		padding: 0.6rem;
	}

	.route-header-card.expanded {
		padding: 0.9rem;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
	}

	.route-header-card.expanded .route-title {
		font-size: 1.05rem;
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
		flex: 1;
	}

	.route-header-left > div {
		flex: 1;
		min-width: 0;
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
	.edit-route-inline {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		width: 100%;
	}

	.edit-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.edit-row.stacked {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.25rem;
	}

	.edit-row.stacked .edit-label {
		min-width: 0;
		white-space: normal;
		margin-bottom: 0;
		color: var(--text-muted);
		font-size: 0.8rem;
	}

	.edit-label {
		font-size: 0.8rem;
		color: var(--text-muted);
		white-space: nowrap;
		flex-shrink: 0;
		min-width: 90px;
	}
	.text-danger {
		color: var(--error-color);
	}

	.route-title {
		color: var(--text-primary);
		font-size: 1rem;
	}

	.edit-route-inline .form-control {
		flex: 1;
		min-width: 0;
		min-height: 40px;
	}

	.edit-route-inline .time-wrap {
		flex: 1;
		min-width: 0;
	}

	.edit-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}
	.cancel-btn {
		background: var(--bg-card);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 14px;
		height: 48px;
		font-size: 0.95rem;
		transition:
			background 0.15s ease,
			border 0.15s ease;
		flex: 1;
	}

	.cancel-btn:hover {
		background: var(--bg-primary);
		border-color: var(--border);
	}

	.save-btn {
		background: var(--edit-btn);
		color: #fff;
		border-radius: 10px;
		font-size: 0.95rem;
		border: none;
		transition:
			opacity 0.15s ease,
			transform 0.1s ease;
		cursor: pointer;
		flex: 1;
		height: 48px;
	}

	.save-btn:hover {
		opacity: 0.95;
		transform: translateY(-1px);
	}

	/*-- Make embedded TimeSelector compact in inline row --*/
	.edit-route-inline :global(.time-selector) {
		gap: 0.35rem;
		width: 100%;
	}

	.edit-route-inline :global(.small-row) {
		display: flex;
		gap: 0.35rem;
	}

	.edit-route-inline :global(.small-row) :global(.select-group) {
		flex: 1 1 0;
		min-width: 0;
	}

	.edit-route-inline :global(.time-selector) :global(label) {
		display: none;
	}

	.edit-route-inline :global(.custom-dropdown-trigger) {
		height: 36px;
		padding: 0.3rem 0.5rem;
		font-size: 0.82rem;
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
	.route-header-landmarks,
	.add-landmark-hint {
		color: var(--text-muted);
	}

	.route-action-btns {
		flex-shrink: 0;
	}

	.create-route-actions {
		padding: 0.5rem 0;
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
		min-height: 72px;
	}

	.timeline-item.is-last {
		min-height: auto;
	}

	.timeline-connector {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 32px;
		min-width: 32px;
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
		width: 24px;
		height: 24px;
		min-height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, #2563eb, #3b82f6);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 1px 6px rgba(37, 99, 235, 0.22);
	}

	.sequence-number {
		color: #fff;
		font-size: 0.65rem;
		font-weight: 700;
		line-height: 1;
	}

	.landmark-card {
		flex: 1;
		background-color: var(--bg-card);
		border: 1px solid var(--border);
		margin-bottom: 0.35rem;
		margin-left: 0.4rem;
		padding: 0.6rem;
		transition:
			box-shadow 0.18s ease,
			transform 0.12s ease;
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
		font-size: 0.72rem;
		color: var(--text-muted);
		margin-top: 0.4rem;
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
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.18s ease;
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

	.icon-btn.delete.disabled,
	.icon-btn.edit.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		border-color: var(--border) !important;
		color: var(--text-muted) !important;
		background: var(--bg-card) !important;
	}

	.icon-btn i {
		font-size: 0.8rem;
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
			font-size: 0.7rem;
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
			overflow: visible;
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
