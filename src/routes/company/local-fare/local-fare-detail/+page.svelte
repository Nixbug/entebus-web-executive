<script lang="ts">
	import FarePageTemplate from '$lib/components/fare-template-components/FarePageTemplate.svelte';
	import { page } from '$app/stores';
	import { localFares } from '$lib/dummy-data';
	import type { Fare } from '$lib/types/type';
	import { derived } from 'svelte/store';
	import HeaderBar from '$lib/components/HeaderBar.svelte';

	let pageTitle = 'Local Fare Detail';
	let pageDescription =
		'Use this page to review, update, or delete the configuration of this local fare template.';
	//-- derive ID from the URL search params --
	const fareId = derived(page, ($page) => $page.url.searchParams.get('id'));

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

	//-- find matching fare (client-side) --
	let selectedFare: Fare | null = null;
	$: selectedFare = $fareId ? localFares.find((f) => f.id === $fareId) ?? null : null;
</script>

<HeaderBar />
{#if selectedFare}
	<FarePageTemplate {pageTitle} {pageDescription} initialData={selectedFare} {listingHref} />
{:else}
	<div style="padding:2rem;color:var(--text-primary);">
		<h5>No fare found</h5>
		<p style="color:var(--text-muted)">Requested fare not found or missing `id` query parameter.</p>
	</div>
{/if}
