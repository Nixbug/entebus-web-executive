<script lang="ts">
    import FarePageTemplate from '$lib/components/fare-template-components/FarePageTemplate.svelte';
    import { page } from '$app/stores';
    import { globalFares } from '$lib/dummy-data';
    import { derived } from 'svelte/store';
    import HeaderBar from '$lib/components/HeaderBar.svelte';

    // derive `id` from the URL search params
    const fareId = derived(page, ($page) => $page.url.searchParams.get('id'));

    // find matching fare (client-side)
    let selectedFare: any = null;
    $: if ($fareId) {
        const id = $fareId;
        if (id) {
            selectedFare = globalFares.find((f) => f.id === id) ?? null;
        }
    }

</script>

<HeaderBar />
{#if selectedFare}
    <FarePageTemplate initialData={selectedFare}  />
{:else}
    <div style="padding:2rem;color:var(--text-primary);">
        <h5>No fare found</h5>
        <p style="color:var(--text-muted)">Requested fare not found or missing `id` query parameter.</p>
    </div>
{/if}
