<script lang="ts">
	import '../app.css'; //-- global styles --
	import Toaster from '$lib/components/Toaster.svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { getToken } from '$lib/services/auth';

	//-- public routes that don't require authentication --
	const publicRoutes = ['/'];

	$: isPublic = publicRoutes.includes($page.url.pathname);

	//-- check if token exists on route change (no API call, instant) --
	$: if (browser && $page.url.pathname) {
		if (!publicRoutes.includes($page.url.pathname) && !getToken()) {
			goto('/', { replaceState: true });
		}
	}
</script>

<slot />
<Toaster />
