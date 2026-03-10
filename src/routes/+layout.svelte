<script lang="ts">
	import '../app.css'; //-- global styles --
	import Toaster from '$lib/components/Toaster.svelte';
	import { page } from '$app/stores';
	import { goto, beforeNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { getToken } from '$lib/services/auth';

	//-- Public routes that don't require authentication --
	const PUBLIC_ROUTES = ['/'];

	function isPublicRoute(path: string): boolean {
		return PUBLIC_ROUTES.includes(path);
	}

	//-- Reactive variable: true if user is authorized to see this page. --
	$: authorized = !browser || isPublicRoute($page.url.pathname) || !!getToken();

	//-- Redirect to login if not authorized. This runs on initial load and on any page change. --
	$: if (browser && !authorized) goto('/', { replaceState: true });

	//-- Before navigation, redirect to login if not authorized. --
	beforeNavigate(({ to, cancel }) => {
		if (!to?.url) return;
		const path = to.url.pathname;
		if (!isPublicRoute(path) && !getToken()) {
			cancel();
			goto('/', { replaceState: true });
		}
	});
</script>

{#if authorized}
	<slot /> <!-- render page content -->
{/if}
<Toaster /> <!-- global toast notifications -->
