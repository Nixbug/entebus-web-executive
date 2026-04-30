<script lang="ts">
	import ServiceInfoPanel from '$lib/components/service-components/ServiceInfoPanel.svelte';
	import ServiceCreatePanel from '$lib/components/service-components/ServiceCreate.svelte';
	import RouteTimeline from '$lib/components/service-components/Timeline.svelte';
	import OperatorAssignmentDropdown from '$lib/components/service-components/OperatorAssignmentDropdown.svelte';
	import type {
		ServiceDetail,
		Landmark,
		LandmarkMap,
		ServiceFare,
		ServiceRouteStop
	} from '$lib/types/type';

	//-- Props --

	//--Using `mode` prop to differentiate between detail and create mode --
	export let mode: 'detail' | 'create' = 'detail';

	//── detail mode: data passed from +page.svelte ──
	export let service: ServiceDetail | null = null;
	export let landmarks: Landmark[] = [];

	//── detail mode: operator assignment API functions ──
	export let loadOperators: (
		q?: string,
		limit?: number,
		offset?: number
	) => Promise<Array<{ id: number; name: string }>> = async () => [];

	export let assignOperator: (serviceId: number, operatorId: number) => Promise<{ assignmentId: number }> = async () => ({ assignmentId: 0 });
	export let unassignOperator: (assignmentId: number) => Promise<void> = async () => {};
	export let fetchAssignedOperators: (
		serviceId: number
	) => Promise<Array<{ id: number; name: string; assignmentId: number }>> = async () => [];

	//── create mode: data passed from create/+page.svelte ──
	export let loadRoutes:
		| ((
				q?: string,
				limit?: number,
				offset?: number
		  ) => Promise<Array<{ id: number; name: string }>>)
		| null = null;
	export let loadFares:
		| ((
				q?: string,
				limit?: number,
				offset?: number
		  ) => Promise<Array<{ id: number; name: string }>>)
		| null = null;
	export let loadVehicles:
		| ((
				q?: string,
				limit?: number,
				offset?: number
		  ) => Promise<Array<{ id: number; name: string }>>)
		| null = null;

	//-- Timeline state (shared between detail and create mode) --
	let timelineRoute: ServiceRouteStop[] = [];
	let timelineLandmarkMap: LandmarkMap = {};
	let timelineFare: ServiceFare | null = null;
	let showTimeline = false;
	let timelineLoading = false;

	//-- When in detail mode, initialize timeline data from service details --
	$: if (mode === 'detail' && service) {
		timelineRoute = service.route;
		timelineFare = service.fare;
		timelineLandmarkMap = landmarks.reduce<LandmarkMap>((acc, l) => {
			if (l.apiId != null) acc[l.apiId] = l;
			return acc;
		}, {});
		showTimeline = true;
	}

	//-- Create mode: receive generated preview from ServiceCreatePanel --
	function handlePreview(
		e: CustomEvent<{
			route: ServiceRouteStop[];
			landmarkMap: LandmarkMap;
			fare: ServiceFare | null;
			loading?: boolean;
		}>
	) {
		//-- If loading, show loading state and hide timeline until preview is ready --
		if (e.detail.loading) {
			timelineLoading = true;
			showTimeline = false;
			return;
		}

		timelineLoading = false;
		timelineRoute = e.detail.route || [];
		timelineLandmarkMap = e.detail.landmarkMap || {};
		timelineFare = e.detail.fare ?? null;
		//-- Only show timeline if we have a valid route and fare (landmarks can be empty if route has no landmarks) --
		showTimeline = Array.isArray(timelineRoute) && timelineRoute.length > 0 && timelineFare != null;
	}

	//-- Mobile toggle --
	let activeMobileView: 'info' | 'timeline' = 'info';
	$: switchLabel = activeMobileView === 'info' ? 'Show route timeline' : 'Show service info';
	$: switchIcon = activeMobileView === 'info' ? 'bi bi-signpost-2' : 'bi bi-info-circle';
	function toggleMobileView() {
		activeMobileView = activeMobileView === 'info' ? 'timeline' : 'info';
	}
</script>

<div class="detail-page">
	<!-- Left panel -->
	<div class="detail-section" class:mobile-hidden={activeMobileView !== 'info'}>
		{#if mode === 'detail' && service}
			<ServiceInfoPanel {service} {landmarks} />
		{:else if mode === 'create'}
			<ServiceCreatePanel
				{loadRoutes}
				{loadFares}
				{loadVehicles}
				on:preview={handlePreview}
				on:create
			/>
		{/if}
	</div>

	<!-- Right panel -->
	<div class="detail-section" class:mobile-hidden={activeMobileView !== 'timeline'}>
		{#if mode === 'detail' && service}
			<div class="assignment-bar">
				<OperatorAssignmentDropdown
					serviceId={service.id}
					{loadOperators}
					{assignOperator}
					{unassignOperator}
					{fetchAssignedOperators}
				/>
			</div>
		{/if}
		{#if timelineLoading}
			<div class="timeline-loading">
				<div class="placeholder-inner">
					<div class="placeholder-icon">
						<i class="bi bi-arrow-repeat spinner"></i>
					</div>
					<p class="placeholder-title">Generating timeline…</p>
					<p class="placeholder-sub">This may take a moment while we compute stops and fares.</p>
				</div>
			</div>
		{:else if showTimeline}
			<RouteTimeline route={timelineRoute} landmarkMap={timelineLandmarkMap} fare={timelineFare} />
		{:else}
			<div class="timeline-placeholder">
				<div class="placeholder-inner">
					<div class="placeholder-icon">
						<i class="bi bi-signpost-2"></i>
					</div>
					<p class="placeholder-title">No timeline yet</p>
					<p class="placeholder-sub">
						Select a vehicle, route and fare to preview the service timeline here.
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<button
	class="mobile-switch-btn"
	type="button"
	aria-label={switchLabel}
	title={switchLabel}
	on:click={toggleMobileView}
>
	<i class={switchIcon}></i>
</button>

<style>
	.assignment-bar {
		margin-bottom: 1rem;
		position: relative;
	}

	.detail-page {
		display: grid;
		grid-template-columns: 500px minmax(0, 1fr);
		gap: 1.5rem;
		align-items: stretch;
		width: 100%;
	}

	.detail-section {
		min-width: 0;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.timeline-placeholder,
	.timeline-loading {
		background: var(--bg-card);
		border: 1.5px dashed var(--border);
		border-radius: 12px;
		padding: 56px 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1 1 0px;
		min-height: 0;
	}

	.timeline-loading {
		background: var(--bg-card);
		border: 1.5px dashed var(--border);
		border-radius: 12px;
		padding: 56px 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 340px;
	}

	.placeholder-inner {
		text-align: center;
		max-width: 260px;
	}

	.placeholder-icon {
		width: 52px;
		height: 52px;
		border-radius: 14px;
		background: var(--bg-primary);
		border: 1px solid var(--border);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16px;
	}

	.placeholder-icon i {
		font-size: 22px;
		color: var(--text-muted);
	}

	.placeholder-title {
		font-size: 15px;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 8px;
	}

	.placeholder-sub {
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.55;
	}

	/* ── Mobile ── */
	.mobile-switch-btn {
		display: none;
		position: fixed;
		right: 20px;
		bottom: 24px;
		z-index: var(--home-button-z-index, 100);
		width: 56px;
		height: 56px;
		border: none;
		border-radius: 999px;
		background: var(--edit-btn);
		color: #fff;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
		cursor: pointer;
		transition:
			transform 0.15s ease,
			opacity 0.15s ease;
	}
	.mobile-switch-btn:hover {
		opacity: 0.95;
		transform: translateY(-1px);
	}
	.mobile-switch-btn i {
		font-size: 22px;
	}

	/* Loader spinner */
	.timeline-loading .spinner {
		font-size: 22px;
		color: var(--text-muted);
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.detail-page {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		.mobile-hidden {
			display: none;
		}
		.mobile-switch-btn {
			display: flex;
		}
	}
</style>