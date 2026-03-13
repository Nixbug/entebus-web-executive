import { apiFetch } from '$lib/services/fetch-client';
import type { components } from '$lib/api/types';
import { Store } from '$lib/stores/session-store';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';

//-- token type from API schema --
type Token = components['schemas']['ExecutiveTokenSchema'];

//-- get client details for token request --
export function getClientDetails() {
	if (typeof navigator === 'undefined') return null;
	return { userAgent: navigator.userAgent || '' };
}

//-- store token in session (+ localStorage if rememberMe) --
export function storeToken(token: Token, rememberMe = false) {
	if (!browser) return;
	const tokenString = JSON.stringify(token);
	Store.storeData('token', tokenString);
	if (rememberMe) localStorage.setItem('token', tokenString);
}

//-- executive login --
export async function executiveLogin(username: string, password: string, clientDetails: string) {
	const apiResponse = await apiFetch<Token>('POST', '/entebus/account/token', {
		contentType: 'form',
		body: { username, password, client_details: clientDetails, grant_type: 'password' }
	});
	if (!apiResponse.ok || !apiResponse.data)
		throw { response: { status: apiResponse.status }, body: apiResponse.data };
	return apiResponse.data;
}

//-- get stored token --
export function getToken(): Token | null {
	if (!browser) return null;
	const tokenString = localStorage.getItem('token') || sessionStorage.getItem('token');
	if (!tokenString) return null;
	try {
		return JSON.parse(tokenString) as Token;
	} catch {
		return null;
	}
}

//-- validate stored token against the server (called on login page mount) --
export async function validateToken(): Promise<boolean> {
	const token = getToken();
	if (!token) return false;
	try {
		const apiResponse = await apiFetch('GET', '/entebus/account/token', {
			accessToken: token.access_token
		});
		if (!apiResponse.ok) {
			if (apiResponse.status === 401 || apiResponse.status === 403) {
				clearToken();
			}
			return false;
		}
		//-- redirect to dashboard --
		goto('/dashboard', { replaceState: true });
		return true;
	} catch (e) {
		clearToken();
		return false;
	}
}

//-- clear all stored token data --
function clearToken() {
	if (!browser) return;
	localStorage.removeItem('token');
	sessionStorage.removeItem('token');
	Store.clearData('token');
}

//-- logout: clear locally --
export function logout() {
	clearToken();
	goto('/', { replaceState: true });
}
