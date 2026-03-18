import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/services/config';

export const isOffline = writable(false);

let timer: ReturnType<typeof setInterval> | null = null;

//-- Ping the API server to verify real internet connectivity --
async function ping(): Promise<boolean> {
	if (!navigator.onLine) return false;
	try {
		const ctrl = new AbortController();
		const id = setTimeout(() => ctrl.abort(), 4000);
		await fetch(API_BASE_URL + '?_cb=' + Date.now(), {
			method: 'HEAD',
			mode: 'no-cors',
			cache: 'no-store',
			signal: ctrl.signal
		});
		clearTimeout(id);
		return true;
	} catch {
		return false;
	}
}

//-- Run a connectivity check and update the store --
export async function checkNow() {
	isOffline.set(!(await ping()));
}

//-- Call once from the root layout's onMount --
export function startNetworkMonitor() {
	if (!browser) return;
	checkNow();
	window.addEventListener('offline', () => isOffline.set(true));
	window.addEventListener('online', () => checkNow());
	timer = setInterval(checkNow, 5000);
}

//-- Call from the root layout's onDestroy --
export function stopNetworkMonitor() {
	if (!browser) return;
	if (timer) clearInterval(timer);
	timer = null;
}
