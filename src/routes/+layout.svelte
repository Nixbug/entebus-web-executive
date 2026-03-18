<script lang="ts">
	import '../app.css';
	import Toaster from '$lib/components/Toaster.svelte';
	import NoNetwork from '$lib/components/NoNetwork.svelte';
	import { page } from '$app/stores';
	import { goto, beforeNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { getToken } from '$lib/services/auth';
	import { isOffline, startNetworkMonitor, stopNetworkMonitor } from '$lib/stores/network-status';

	const PUBLIC_ROUTES = ['/'];
	const isPublicRoute = (path: string) => PUBLIC_ROUTES.includes(path);

	let authorized = false;
	$: authorized = isPublicRoute($page.url.pathname) || !!getToken();
	$: if (!authorized) goto('/', { replaceState: true });

	//-- Before navigation, redirect to login if not authorized. Register hook only on client. --
	if (browser) {
		beforeNavigate(({ to, cancel }) => {
			if (!to?.url) return;
			//-- Block all navigation while offline to prevent URL changing --
			if ($isOffline) {
				cancel();
				return;
			}
			if (!isPublicRoute(to.url.pathname) && !getToken()) {
				cancel();
				goto('/', { replaceState: true });
			}
		});
	}

	onMount(() => startNetworkMonitor());
	onDestroy(() => stopNetworkMonitor());
</script>

<NoNetwork />
{#if !$isOffline && authorized}
	<slot />
{/if}
<Toaster />
