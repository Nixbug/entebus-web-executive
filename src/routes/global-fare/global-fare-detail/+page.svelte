<script lang="ts">
	import FarePageTemplate from '$lib/components/fare-template-components/FarePageTemplate.svelte';
	import { page } from '$app/stores';
	import { globalFares } from '$lib/dummy-data';
	import type { GlobalFare } from '$lib/types/type';
	import { derived } from 'svelte/store';
	import HeaderBar from '$lib/components/HeaderBar.svelte';

	let pageTitle = 'Global Fare Detail';
	let pageDescription =
		'Use this page to review, update, or delete the configuration of this global fare template.';
	//-- derive ID from the URL search params --
	const fareId = derived(page, ($page) => $page.url.searchParams.get('id'));

	//-- find matching fare (client-side) --
	let selectedFare: GlobalFare | null = null;
	$: selectedFare = $fareId ? globalFares.find((f) => f.id === $fareId) ?? null : null;
</script>

<HeaderBar />
{#if selectedFare}
	<FarePageTemplate {pageTitle} {pageDescription} initialData={selectedFare} />
{:else}
	<div style="padding:2rem;color:var(--text-primary);">
		<h5>No fare found</h5>
		<p style="color:var(--text-muted)">Requested fare not found or missing `id` query parameter.</p>
	</div>
{/if}
