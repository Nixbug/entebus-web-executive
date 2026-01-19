<script lang="ts">
    import HeaderBar from '$lib/components/HeaderBar.svelte';
    import FarePageTemplate from '$lib/components/fare-template-components/FarePageTemplate.svelte';

    function handleCreate(event:any) {
        const data = event.detail;
        // Parent should call backend API to create fare
        console.log('Fare create requested', data);
    }

</script>

<HeaderBar />
<FarePageTemplate on:create={handleCreate} />