<script lang="ts">
	import '../app.css'; //-- global styles --
	import Toaster from '$lib/components/Toaster.svelte';
</script>

<slot /> 
<Toaster />