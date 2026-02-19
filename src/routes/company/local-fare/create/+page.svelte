<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import FarePageTemplate from '$lib/components/fare-template-components/FarePageTemplate.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let pageTitle = 'Create Local Fare';
	let pageDescription = 'Use this page to create a new local fare.';

	//-- Preserve company context so the back button returns to the correct filtered listing --
	$: companyId = $page.url.searchParams.get('companyId');
	$: companyName = $page.url.searchParams.get('name');
	$: companyStatus = $page.url.searchParams.get('status');
	$: {
		const params = new URLSearchParams();
		if (companyId) params.set('companyId', companyId);
		if (companyName) params.set('name', companyName);
		if (companyStatus) params.set('status', companyStatus);
		const qs = params.toString();
		listingHref = `/company/local-fare${qs ? `?${qs}` : ''}`;
	}
	let listingHref = '/company/local-fare';

	//-- Handle fare creation event --
	function handleCreate(event: any) {
		alert('created fare');
		goto(listingHref);
	}
</script>

<HeaderBar />
<FarePageTemplate {pageTitle} {pageDescription} on:create={handleCreate} {listingHref} />
