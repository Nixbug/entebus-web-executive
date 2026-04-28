<script lang="ts">
	//-- servicedetailpage.svelte
	import ServiceInfoPanel from '$lib/components/service-components/ServiceInfoPanel.svelte';
	import RouteTimeline from '$lib/components/service-components/Timeline.svelte';
	import type { ServiceDetail, Landmark, LandmarkMap } from '$lib/types/type';

	export let service: ServiceDetail;
	export let landmarks: Landmark[] = [];
	let activeMobileView: 'info' | 'timeline' = 'info';

	$: landmarkMap = landmarks.reduce<LandmarkMap>((acc, l) => {
		if (l.apiId != null) acc[l.apiId] = l;
		return acc;
	}, {});
	$: switchLabel = activeMobileView === 'info' ? 'Show route timeline' : 'Show service info';
	$: switchIcon = activeMobileView === 'info' ? 'bi bi-signpost-2' : 'bi bi-info-circle';

	function toggleMobileView() {
		activeMobileView = activeMobileView === 'info' ? 'timeline' : 'info';
	}
</script>

<div class="detail-page">
	<div class="detail-section" class:mobile-hidden={activeMobileView !== 'info'}>
		<ServiceInfoPanel {service} {landmarks} />
	</div>
	<div class="detail-section" class:mobile-hidden={activeMobileView !== 'timeline'}>
		<RouteTimeline route={service.route} {landmarkMap} fare={service.fare} />
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
	.detail-page {
		display: grid;
		grid-template-columns: 380px minmax(0, 1fr);
		gap: 1.5rem;
		align-items: start;
		width: 100%;
	}

	.detail-section {
		min-width: 0;
	}

	.mobile-switch-btn {
		display: none;
		position: fixed;
		right: 20px;
		bottom: 24px;
		z-index: var(--home-button-z-index);
		width: 56px;
		height: 56px;
		border: none;
		border-radius: 999px;
		background: var(--edit-btn);
		color: #fff;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
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
