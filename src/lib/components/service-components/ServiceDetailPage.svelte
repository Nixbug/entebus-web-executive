<script lang="ts">
	import ServiceInfoPanel from '$lib/components/service-components/ServiceInfoPanel.svelte';
	import RouteTimelineee from '$lib/components/service-components/RouteTimeLine.svelte';
	import type { ServiceDetail, Landmark, LandmarkMap } from '$lib/types/type';

	export let service: ServiceDetail;
	export let landmarks: Landmark[] = [];

	// Build lookup map: landmark apiId → Landmark
	// landmarkMap key is number (apiId) to match ServiceRouteStop.landmarkId
	$: landmarkMap = landmarks.reduce<LandmarkMap>((acc, l) => {
		if (l.apiId != null) acc[l.apiId] = l;
		return acc;
	}, {});
</script>

<div class="detail-page">
	<ServiceInfoPanel {service} {landmarks} />
	<RouteTimelineee route={service.route} {landmarkMap} />
</div>

<style>
	.detail-page {
		display: grid;
		grid-template-columns: 340px 1fr;
		min-height: 100vh;
		background: var(--color-bg-page, #f5f5f3);
	}

	@media (max-width: 768px) {
		.detail-page {
			grid-template-columns: 1fr;
		}
	}
</style>