<script lang="ts">
    import HeaderBar from '$lib/components/HeaderBar.svelte';
    import FarePageTemplate from '$lib/components/fare-template-components/FarePageTemplate.svelte';

    let pageTitle = 'Create Global Fare Template';
    let pageDescription = 'Use this page to create a new global fare.';
    function handleCreate(event:any) {
        const data = event.detail;
        // Parent should call backend API to create fare
        console.log('Fare create requested', data);
    }

</script>

<HeaderBar />
<FarePageTemplate pageTitle={pageTitle} pageDescription={pageDescription} on:create={handleCreate} />