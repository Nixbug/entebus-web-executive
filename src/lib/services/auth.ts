import { apiFetch } from '$lib/services/fetch-client';
import type { components } from '$lib/api/types';
import { Store } from '$lib/stores/session-store';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { applyTheme } from '$lib/theme';
import toast from '$lib/utils/toast';

//-- token type from API schema --
type Token = components['schemas']['ExecutiveTokenSchema'];

//-- refresh timer handle --
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

//-- tracks whether the current token was stored persistently --
let persistedRememberMe = false;

type ErrorBody = {
	detail?: string;
};

function isInvalidTokenResponse(status: number, body: unknown): boolean {
	if (status !== 401) return false;
	if (!body || typeof body !== 'object') return false;
	const detail = (body as ErrorBody).detail;
	return typeof detail === 'string' && detail.toLowerCase().includes('invalid token');
}

function handleInvalidSession(message = 'Your session has ended. Please sign in again.') {
	clearToken();
	toast.warning(message);
}

//-- get client details for token request --
export function getClientDetails() {
	if (typeof navigator === 'undefined') return null;
	return { userAgent: navigator.userAgent || '' };
}

//-- store token in session (+ localStorage if rememberMe) --
export function storeToken(token: Token, rememberMe = false) {
	const tokenString = JSON.stringify(token);
	Store.storeData<Token>('token', token);
	persistedRememberMe = rememberMe;
	if (rememberMe) {
		localStorage.setItem('token', tokenString);
	} else {
		localStorage.removeItem('token');
	}
}

//-- executive login --
export async function executiveLogin(username: string, password: string, clientDetails?: string) {
	const apiResponse = await apiFetch<Token>('POST', '/entebus/account/token', {
		contentType: 'form',
		body: {
			username,
			password,
			grant_type: 'password',
			...(clientDetails ? { client_details: clientDetails } : {})
		}
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
		const apiResponse = await apiFetch<ErrorBody>('GET', '/entebus/account/token', {
			accessToken: token.access_token
		});
		if (!apiResponse.ok) {
			if (isInvalidTokenResponse(apiResponse.status, apiResponse.data)) {
				handleInvalidSession('Your session has expired. Please sign in again.');
				return false;
			}
			if (apiResponse.status === 401 || apiResponse.status === 403) {
				clearToken();
			}
			return false;
		}
		return true;
	} catch (e) {
		clearToken();
		return false;
	}

	//-- redirect to dashboard --
	goto('/dashboard', { replaceState: true });
	return true;
}

//-- schedule an automatic token refresh 5 minutes before expiry --
export function scheduleTokenRefresh(token: Token) {
	stopTokenRefresh();

	const REFRESH_BUFFER_SECONDS = 300; //-- 5 minutes --
	const delayMs = (token.expires_in - REFRESH_BUFFER_SECONDS) * 1000;

	//-- if token expires in less than 5 minutes, refresh immediately --
	const safeDelay = Math.max(delayMs, 0);

	refreshTimer = setTimeout(async () => {
		try {
			const apiResponse = await apiFetch<Token>('POST', '/entebus/account/token/refresh', {
				contentType: 'form',
				body: { refresh_token: token.refresh_token, grant_type: 'refresh_token' },
				accessToken: token.access_token
			});
			if (!apiResponse.ok || !apiResponse.data) {
				//-- refresh failed — force re-login --
				clearToken();
				goto('/', { replaceState: true });
				return;
			}

			//-- store refreshed token and schedule the next refresh --
			storeToken(apiResponse.data, persistedRememberMe);
			scheduleTokenRefresh(apiResponse.data);
		} catch {
			//-- network error during refresh — force re-login --
			clearToken();
			goto('/', { replaceState: true });
		}
	}, safeDelay);
}

//-- cancel any pending refresh timer --
export function stopTokenRefresh() {
	if (refreshTimer) {
		clearTimeout(refreshTimer);
		refreshTimer = null;
	}
}

//-- clear all stored token data --
function clearToken() {
	stopTokenRefresh();
	localStorage.removeItem('token');
	localStorage.removeItem('username');
	sessionStorage.removeItem('token');
	Store.clearData('token');
}

//-- logout: revoke on server, then clear locally --
export async function logout() {
	const token = getToken();
	if (token) {
		try {
			const revokeResponse = await apiFetch<ErrorBody>('POST', '/entebus/account/token/revoke', {
				contentType: 'form',
				body: { token: token.access_token },
				accessToken: token.access_token
			});

			if (isInvalidTokenResponse(revokeResponse.status, revokeResponse.data)) {
				handleInvalidSession('You have been signed out. Please sign in again.');
				if (browser) {
					localStorage.removeItem('theme');
					applyTheme(false);
				}
				goto('/', { replaceState: true });
				return;
			}
		} catch {
			//-- ignore revoke errors, proceed to clear local data --
		}
	}
	//-- remove saved theme and reset applied theme so login screen shows default style --
	if (browser) {
		localStorage.removeItem('theme');
		applyTheme(false);
	}
	clearToken();
	goto('/', { replaceState: true });
	toast.success('Logged out successfully');
}
