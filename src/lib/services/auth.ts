import {
	apiFetch,
	registerInvalidSessionHandler,
	registerTokenProvider,
	registerRefreshCallback
} from '$lib/services/fetch-client';
import type { components } from '$lib/api/types';
import { Store } from '$lib/stores/session-store';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { applyTheme } from '$lib/theme';
import toast from '$lib/utils/toast';
import { encrypt, decrypt } from '$lib/stores/crypto';
import { fetchRoleMap } from '$lib/services/executive-role-map';
import { fetchRoleById } from '$lib/services/executive-role';

//-- token type from API schema --
type Token = components['schemas']['ExecutiveTokenSchema'];

//-- refresh timer handle --
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

//-- cached decrypted token so getToken() stays synchronous --
let cachedToken: Token | null = null;

//-- tracks whether the current token was stored persistently --
let persistedRememberMe = false;
//-- Initialize persistedRememberMe from localStorage on module load (browser only) --
if (browser) {
	persistedRememberMe = localStorage.getItem('persistedRememberMe') === 'true';
}

//-- Handles invalid session on client: clears token, resets theme, notifies user, and redirects to login. --
function handleInvalidSession() {
	if (browser) {
		clearToken();
		localStorage.removeItem('theme');
		applyTheme(false);
		toast.warning('You have been signed out. Please sign in again.');
		goto('/', { replaceState: true });
	}
}

//-- Register the global invalid session handler with the fetch client, so that any API call that detects an invalid token can trigger a centralized logout and user notification. --
registerInvalidSessionHandler(handleInvalidSession);

//-- get client details for token request --
export function getClientDetails() {
	if (typeof navigator === 'undefined') return null;
	return { userAgent: navigator.userAgent || '' };
}

//-- decrypt persisted token into cache on app startup --
export async function initToken(): Promise<void> {
	if (!browser) return;
	//-- try localStorage first (Remember Me), then sessionStorage --
	const stored = localStorage.getItem('token') ?? sessionStorage.getItem('token');
	if (!stored) return;
	try {
		const decrypted = await decrypt(stored);
		//-- if decrypt returns null the value may be legacy plaintext JSON --
		cachedToken = JSON.parse(decrypted ?? stored) as Token;
		//-- migrate unencrypted token to encrypted form --
		if (!decrypted) {
			const encrypted = await encrypt(stored);
			if (localStorage.getItem('token')) localStorage.setItem('token', encrypted);
			if (sessionStorage.getItem('token')) sessionStorage.setItem('token', encrypted);
		}
	} catch {
		localStorage.removeItem('token');
		sessionStorage.removeItem('token');
		localStorage.removeItem('persistedRememberMe');
		localStorage.removeItem('permissions');
		persistedRememberMe = false;
	}
}

//-- store token encrypted in sessionStorage (+ localStorage if rememberMe) --
export async function storeToken(token: Token, rememberMe = false) {
	cachedToken = token;
	const encrypted = await encrypt(JSON.stringify(token));
	sessionStorage.setItem('token', encrypted);
	persistedRememberMe = rememberMe;
	if (rememberMe) {
		localStorage.setItem('token', encrypted);
		localStorage.setItem('persistedRememberMe', 'true');
	} else {
		localStorage.removeItem('token');
		localStorage.removeItem('persistedRememberMe');
	}
}

//-- executive login --
export async function executiveLogin(username: string, password: string, clientDetails?: string) {
	const apiResponse = await apiFetch<Token>('POST', '/entebus/account/token', {
		contentType: 'form',
		accessToken: null,
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

//-- get stored token (sync — reads from cache populated by initToken/storeToken) --
export function getToken(): Token | null {
	if (!browser) return null;
	return cachedToken;
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
		return true;
	} catch (e) {
		clearToken();
		return false;
	}
}

//-- performs the token refresh API call, stores the new token and schedules the next refresh --
async function performRefresh(): Promise<string | null> {
	const token = getToken();
	if (!token?.refresh_token) {
		clearToken();
		if (browser) goto('/', { replaceState: true });
		return null;
	}
	try {
		const apiResponse = await apiFetch<Token>('POST', '/entebus/account/token/refresh', {
			contentType: 'form',
			body: { refresh_token: token.refresh_token, grant_type: 'refresh_token' },
			accessToken: token.access_token
		});

		//-- if refresh fails due to invalid token, the global handler will clear the token and redirect, so just return null here to avoid duplicate handling --
		if (!getToken()) {
			return null;
		}

		if (!apiResponse.ok || !apiResponse.data) {
			clearToken();
			if (browser) goto('/', { replaceState: true });
			return null;
		}

		await storeToken(apiResponse.data, persistedRememberMe);
		scheduleTokenRefresh(apiResponse.data);
		return apiResponse.data.access_token;
	} catch {
		//-- if the global handler already cleared the token, avoid duplicate work --
		if (!getToken()) return null;
		clearToken();
		if (browser) goto('/', { replaceState: true });
		return null;
	}
}

//-- schedule an automatic token refresh 5 minutes before expiry --
export function scheduleTokenRefresh(token: Token) {
	stopTokenRefresh();

	const REFRESH_BUFFER_SECONDS = 300; //-- 5 minutes --
	const delayMs = (token.expires_in - REFRESH_BUFFER_SECONDS) * 1000;

	//-- if token expires in less than 5 minutes, refresh immediately --
	const safeDelay = Math.max(delayMs, 0);

	refreshTimer = setTimeout(performRefresh, safeDelay);
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
	cachedToken = null;
	if (!browser) return;
	try {
		localStorage.removeItem('token');
		localStorage.removeItem('username');
		localStorage.removeItem('persistedRememberMe');
		localStorage.removeItem('permissions');
	} catch {}
	try {
		sessionStorage.removeItem('token');
		Store.clearData('username');
		Store.clearData('permissions');
	} catch {}
}

//-- logout: revoke on server, then clear locally --
export async function logout() {
	const token = getToken();
	if (token) {
		try {
			await apiFetch('POST', '/entebus/account/token/revoke', {
				contentType: 'form',
				body: { token: token.access_token },
				accessToken: token.access_token
			});

			//-- If apiFetch handled an invalid token globally, avoid duplicate logout toast/redirect. --
			if (!getToken()) return;
		} catch {
			//-- ignore revoke errors, proceed to clear local data --
		}
	}
	//-- remove saved theme and reset applied theme so login screen shows default style --
	if (browser) {
		localStorage.removeItem('theme');
		localStorage.removeItem('permissions');
		applyTheme(false);
	}
	clearToken();
	goto('/', { replaceState: true });
	toast.success('Logged out successfully');
}

//-- Register the token provider with the fetch client, so that it can automatically inject the current token into API requests in auto mode. --
registerTokenProvider(() => getToken()?.access_token ?? null);
registerRefreshCallback(performRefresh);

//-- persist permissions to localStorage when Remember Me is active --
function savePermissions(permissions: unknown): void {
	Store.storeData('permissions', permissions);
	if (browser) {
		try {
			if (localStorage.getItem('persistedRememberMe') === 'true') {
				localStorage.setItem('permissions', JSON.stringify(permissions));
			} else {
				localStorage.removeItem('permissions');
			}
		} catch (err) {
			console.error('savePermissions error', err);
		}
	}
}

//-- restore permissions from localStorage for remembered sessions --
function restorePermissionsFromLocalStorage(): void {
	if (!browser) return;
	try {
		if (localStorage.getItem('persistedRememberMe') !== 'true') {
			localStorage.removeItem('permissions');
			return;
		}
		const stored = localStorage.getItem('permissions');
		if (!stored) return;
		Store.storeData('permissions', JSON.parse(stored));
	} catch (err) {
		console.error('restorePermissionsFromLocalStorage error', err);
		try {
			localStorage.removeItem('permissions');
			localStorage.removeItem('persistedRememberMe');
			persistedRememberMe = false;
		} catch (cleanupErr) {
			console.error('Failed to clear corrupted permissions from localStorage', cleanupErr);
		}
	}
}

//-- load permissions after login: rolemap → role → store permissions --
export async function loadPermissions(): Promise<void> {
	const token = getToken();
	if (!token) {
		clearPermissions();
		return;
	}
	try {
		clearPermissions();
		const maps = await fetchRoleMap(token.executive_id);
		if (!maps.length) {
			if (browser) toast.info('No roles assigned to your account.');
			return;
		}
		const role = await fetchRoleById(maps[0].role_id);
		if (role?.permissions) {
			savePermissions(role.permissions);
		} else {
			clearPermissions();
			if (browser) toast.warning('Failed to load role permissions.');
		}
	} catch (err) {
		console.error('loadPermissions error', err);
		clearPermissions();
		if (browser) toast.error('Unable to load permissions. Some features may be unavailable.');
	}
}

function clearPermissions(): void {
	Store.storeData('permissions', null);
	if (browser) {
		try {
			localStorage.removeItem('permissions');
		} catch (err) {
			console.error('clearPermissions error', err);
		}
	}
}

//-- On module init, restore permissions from localStorage for remembered sessions --
restorePermissionsFromLocalStorage();
