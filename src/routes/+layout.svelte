<script lang="ts">
	import '../app.css'; //-- global styles --
	import Toaster from '$lib/components/Toaster.svelte';
	import { page } from '$app/stores';
	import { goto, beforeNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { getToken } from '$lib/services/auth';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import toast from '$lib/utils/toast';
	import NoNetwork from '$lib/components/NoNetwork.svelte';

	const isOnline = writable(false);
	//-- Public routes that don't require authentication --
	const PUBLIC_ROUTES = ['/'];

	function isPublicRoute(path: string): boolean {
		return PUBLIC_ROUTES.includes(path);
	}

	//-- Check if user is authorized to view current page --
	let authorized = false;
	$: authorized = isPublicRoute($page.url.pathname) || !!getToken();

	//-- Redirect to login if not authorized. This runs on initial load and on any page change. --
	$: if (!authorized) goto('/', { replaceState: true });

	//-- Before navigation, redirect to login if not authorized. Register hook only on client. --
	if (browser) {
		beforeNavigate(({ to, cancel }) => {
			if (!to?.url) return;
			const path = to.url.pathname;
			if (!isPublicRoute(path) && !getToken()) {
				cancel();
				goto('/', { replaceState: true });
			}
		});
	}
	onMount(() => {
		isOnline.set(browser && typeof navigator !== 'undefined' ? navigator.onLine : false);

		const handleOnline = () => {
			isOnline.set(true);
			toast.success('You\'re online now');
		};

		const handleOffline = () => {
			isOnline.set(false);
			toast.error('You\'re offline now');
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});
</script>

{#if authorized}
	<!-- render page content -->
	<slot />
{/if}
{#if !$isOnline}
	<!-- show no network overlay -->
	<NoNetwork />
{/if}
<!-- global toast notifications -->
<Toaster />
