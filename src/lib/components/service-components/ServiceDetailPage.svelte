<script lang="ts">
	//-- servicedetailpage.svelte
	import ServiceInfoPanel from '$lib/components/service-components/ServiceInfoPanel.svelte';
	import RouteTimeline from '$lib/components/service-components/Timeline.svelte';
	import type { ServiceDetail, Landmark, LandmarkMap } from '$lib/types/type';

	export let service: ServiceDetail;
	export let landmarks: Landmark[] = [];

	$: landmarkMap = landmarks.reduce<LandmarkMap>((acc, l) => {
		if (l.apiId != null) acc[l.apiId] = l;
		return acc;
	}, {});
</script>

<div class="detail-page">
	<ServiceInfoPanel {service} {landmarks} />
	<RouteTimeline route={service.route} {landmarkMap} fare={service.fare} />
</div>

<style>
	.detail-page {
		display: grid;
		grid-template-columns: 380px minmax(0, 1fr);
		min-height: 100vh;
		background: var(--bg-primary);
	}

	@media (max-width: 768px) {
		.detail-page {
			grid-template-columns: 1fr;
		}
	}
</style>
