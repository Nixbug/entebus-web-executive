import { apiFetch } from '$lib/services/fetch-client';
import type { components } from '$lib/api/types';
import { Store } from '$lib/stores/session-store';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import type { ExecutiveToken } from '$lib/types/type';

type TokenSchema = components['schemas']['ExecutiveTokenSchema'];

//-- map API snake_case response → app camelCase type --
function mapToken(t: TokenSchema): ExecutiveToken {
	return {
		id: t.id,
		executiveId: t.executive_id,
		accessToken: t.access_token,
		refreshToken: t.refresh_token,
		expiresIn: t.expires_in,
		refreshBefore: t.refresh_before,
		platformType: t.platform_type,
		tokenType: t.token_type ?? 'bearer',
		createdOn: t.created_on,
		clientDetails: t.client_details
	};
}

export function getClientDetails() {
	if (typeof navigator === 'undefined') return null;
	return { userAgent: navigator.userAgent || '' };
}

//-- store token in session (+ localStorage if rememberMe) --
export function storeToken(token: ExecutiveToken, rememberMe = false) {
	const str = JSON.stringify(token);
	Store.storeData('token', str);
	if (rememberMe) localStorage.setItem('token', str);
}

//-- login --
export async function login(username: string, password: string, clientDetails: string) {
	const res = await apiFetch<TokenSchema>('POST', '/entebus/account/token', {
		contentType: 'form',
		body: { username, password, client_details: clientDetails, grant_type: 'password', platform_type: 2, scope: '' }
	});
	if (!res.ok || !res.data) throw { response: { status: res.status }, body: res.data };
	return mapToken(res.data);
}

//-- get stored token --
export function getToken(): ExecutiveToken | null {
	if (!browser) return null;
	const str = localStorage.getItem('token') || sessionStorage.getItem('token');
	if (!str) return null;
	try {
		return JSON.parse(str) as ExecutiveToken;
	} catch {
		return null;
	}
}

//-- validate stored token against the server (called on login page mount) --
export async function validateToken(): Promise<boolean> {
	const token = getToken();
	if (!token) return false;

	const res = await apiFetch('GET', '/entebus/account/token', {
		accessToken: token.accessToken
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
