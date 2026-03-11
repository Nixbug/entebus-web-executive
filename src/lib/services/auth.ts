import { apiFetch } from '$lib/services/fetch-client';
import type { components } from '$lib/api/types';
import { Store } from '$lib/stores/session-store';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { log } from 'console';

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
//-- token type from API schema --
type Token = components['schemas']['ExecutiveTokenSchema'];

//-- get client details for token request --
export function getClientDetails() {
	if (typeof navigator === 'undefined') return null;
	return { userAgent: navigator.userAgent || '' };
}

//-- store token in session (+ localStorage if rememberMe) --
export function storeToken(token: Token, rememberMe = false) {
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
	console.log('Login API response:.....', apiResponse);
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

	const apiResponse = await apiFetch('GET', '/entebus/account/token', {
		accessToken: token.access_token
	});

	if (apiResponse.status === 401 || apiResponse.status === 403) {
		clearToken();
		return false;
	}

	//-- redirect to dashboard --
	goto('/dashboard', { replaceState: true });
	return true;
}

function doTokenRefresh(token: Token) {
	if (refreshTimer) clearTimeout(refreshTimer);
	const delayMs = (token.expires_in - 300) * 1000; //-- refresh 5 minutes before expiry --
	if (delayMs <= 0) return;
	refreshTimer = setTimeout(async () => {
		try {
			const apiResponse = await apiFetch<Token>('POST', '/entebus/account/token/refresh', {
				contentType: 'form',
				body: { refresh_token: token.refresh_token, grant_type: 'refresh_token' },
				accessToken: token.access_token
			});
			if (!apiResponse.ok || !apiResponse.data) return;
			storeToken(apiResponse.data, true);
			doTokenRefresh(apiResponse.data);
		} catch {
			clearToken();
			goto('/', { replaceState: true });
		}
	}, delayMs);
}

//-- clear all stored token data --
function clearToken() {
	localStorage.removeItem('token');
	sessionStorage.removeItem('token');
	Store.clearData('token');
}

//-- logout: clear locally --
export function logout() {
	const token = getToken();
	if (token) {
		try {
			console.log('Revoking token on server...');
			apiFetch('POST', '/entebus/account/token/revoke', {
				contentType: 'form',
				body: { token: token.access_token },
				accessToken: token.access_token
			});
			console.log('Token revoke request sent.', token);
		} catch {
			//-- ignore errors, proceed to clear local data --
		}
	}
	clearToken();
	goto('/', { replaceState: true });
}
