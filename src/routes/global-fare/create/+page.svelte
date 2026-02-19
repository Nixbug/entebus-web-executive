<script lang="ts">
	import { goto } from '$app/navigation';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import FarePageTemplate from '$lib/components/fare-template-components/FarePageTemplate.svelte';

	let pageTitle = 'Create Global Fare';
	let pageDescription = 'Use this page to create a new global fare.';

	//-- Handle fare creation event --
	function handleCreate(event: any) {
		alert('created fare');
		goto('/global-fare');
	}
</script>

<HeaderBar />
<FarePageTemplate {pageTitle} {pageDescription} on:create={handleCreate} />
