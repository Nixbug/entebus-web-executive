<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	//-- This page is a fallback for direct URL navigation to /no-network.
	//   The actual no-network UI is rendered as an overlay in +layout.svelte.
	//   If someone lands here while online, redirect them to the dashboard. --
	onMount(() => {
		if (browser && navigator.onLine) {
			goto('/dashboard', { replaceState: true });
		}
	});
</script>

<!-- Intentionally empty — the layout overlay handles the no-network UI -->
