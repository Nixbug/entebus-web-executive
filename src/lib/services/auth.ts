import { apiFetch } from '$lib/services/fetch-client';
import type { components } from '$lib/api/types';
import { Store } from '$lib/stores/session-store';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';

type Token = components['schemas']['ExecutiveTokenSchema'];

//-- get client details for token request --
export function getClientDetails() {
	if (typeof navigator === 'undefined') return null;
	return { userAgent: navigator.userAgent || '' };
}

//-- store token in session (+ localStorage if rememberMe) --
export function storeToken(token: Token, rememberMe = false) {
	const str = JSON.stringify(token);
	Store.storeData('token', str);
	if (rememberMe) localStorage.setItem('token', str);
}

//-- login --
export async function login(username: string, password: string, clientDetails: string) {
	const res = await apiFetch<Token>('POST', '/entebus/account/token', {
		contentType: 'form',
		body: { username, password, client_details: clientDetails, grant_type: 'password', platform_type: 2, scope: '' }
	});
	if (!res.ok || !res.data) throw { response: { status: res.status }, body: res.data };
	return res.data;
}

//-- get stored token --
export function getToken(): Token | null {
	if (!browser) return null;
	const str = localStorage.getItem('token') || sessionStorage.getItem('token');
	if (!str) return null;
	try {
		return JSON.parse(str) as Token;
	} catch {
		return null;
	}
}

//-- validate stored token against the server (called on login page mount) --
export async function validateToken(): Promise<boolean> {
	const token = getToken();
	if (!token) return false;

	const res = await apiFetch('GET', '/entebus/account/token', {
		accessToken: token.access_token
	});

	if (res.status === 401 || res.status === 403) {
		clearToken();
		return false;
	}

	//-- valid (200) or network error — let through --
	goto('/dashboard', { replaceState: true });
	return true;
}

//-- clear all stored token data --
function clearToken() {
	localStorage.removeItem('token');
	sessionStorage.removeItem('token');
	Store.clearData('token');
}

//-- logout: clear locally --
export function logout() {
	clearToken();
	goto('/', { replaceState: true });
}
