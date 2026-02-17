<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import FarePageTemplate from '$lib/components/fare-template-components/FarePageTemplate.svelte';

	let pageTitle = 'Create Local Fare';
	let pageDescription = 'Use this page to create a new local fare.';

	//-- Handle fare creation event --
	function handleCreate(event: any) {
		const data = event.detail;
		console.log('Fare create requested', data);
	}
</script>

<HeaderBar />
<FarePageTemplate {pageTitle} {pageDescription} on:create={handleCreate} listingHref="/company/local-fare" />
