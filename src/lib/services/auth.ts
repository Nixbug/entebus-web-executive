import createClient from 'openapi-fetch';
import type { paths, components } from '$lib/api/types';
import { API_BASE_URL } from '$lib/services/config';
import { Store } from '$lib/stores/session-store';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import type { ExecutiveToken } from '$lib/types/type';

//-- unauthed client (login, refresh) --
const api = createClient<paths>({ baseUrl: API_BASE_URL });

//-- authed client factory --
function authedApi() {
	const token = getToken();
	return createClient<paths>({
		baseUrl: API_BASE_URL,
		headers: { Authorization: `Bearer ${token?.accessToken}` }
	});
}

//-- map API snake_case response to app camelCase type --
function mapToken(t: components['schemas']['ExecutiveTokenSchema']): ExecutiveToken {
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

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function getClientDetails() {
	if (typeof navigator === 'undefined') return null;
	return { userAgent: navigator.userAgent || '' };
}

//-- store token in session/local storage and schedule refresh --
export function storeToken(token: ExecutiveToken, rememberMe: boolean = false) {
	const tokenString = JSON.stringify(token);
	Store.storeData('token', tokenString);
	if (rememberMe) localStorage.setItem('token', tokenString);
	scheduleTokenRefresh(token);
}

//-- login --
export async function login(username: string, password: string, clientDetails: string) {
	const { data, error, response } = await api.POST('/entebus/account/token', {
		body: {
			username,
			password,
			client_details: clientDetails,
			grant_type: 'password',
			platform_type: 2,
			scope: ''
		},
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		bodySerializer: (body) => new URLSearchParams(body as unknown as Record<string, string>)
	});
	if (error) throw { response, body: error };
	return mapToken(data);
}

//-- get stored token --
export function getToken(): ExecutiveToken | null {
	if (!browser) return null;
	const tokenString = localStorage.getItem('token') || sessionStorage.getItem('token');
	if (!tokenString) return null;
	try {
		return JSON.parse(tokenString) as ExecutiveToken;
	} catch {
		return null;
	}
}

//-- validate token and redirect to dashboard if valid (used on login page) --
export async function validateToken(): Promise<boolean> {
	const token = getToken();
	if (!token) return false;
	try {
		const { error } = await authedApi().GET('/entebus/account/token');
		if (error) {
			clearToken();
			return false;
		}
		Store.storeData('token', JSON.stringify(token));
		scheduleTokenRefresh(token);
		goto('/dashboard', { replaceState: true });
		return true;
	} catch {
		//-- Network/server error — keep token, let user proceed --
		Store.storeData('token', JSON.stringify(token));
		scheduleTokenRefresh(token);
		goto('/dashboard', { replaceState: true });
		return true;
	}
}

//-- schedule refresh 5 min before access token expires --
function scheduleTokenRefresh(token: ExecutiveToken) {
	if (refreshTimer) clearTimeout(refreshTimer);
	const delayMs = (token.expiresIn - 300) * 1000;
	if (delayMs <= 0) return;
	refreshTimer = setTimeout(async () => {
		try {
			const { data, error, response } = await api.POST('/entebus/account/token/refresh', {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: { refresh_token: token.refreshToken, grant_type: 'refresh_token' },
				bodySerializer: (body) => new URLSearchParams(body as unknown as Record<string, string>)
			});
			if (error) {
				clearToken();
				goto('/', { replaceState: true });
				return;
			}
			const newToken = mapToken(data);
			const rememberMe = !!localStorage.getItem('token');
			storeToken(newToken, rememberMe);
		} catch {
			clearToken();
			goto('/', { replaceState: true });
		}
	}, delayMs);
}

//-- clear token --
function clearToken() {
	if (refreshTimer) clearTimeout(refreshTimer);
	refreshTimer = null;
	localStorage.removeItem('token');
	sessionStorage.removeItem('token');
	Store.clearData('token');
}

//-- logout (revoke on server, then clear local) --
export async function logout() {
	const token = getToken();
	if (token) {
		try {
			await authedApi().POST('/entebus/account/token/revoke', {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: { token: token.accessToken },
				bodySerializer: (body) => new URLSearchParams(body as unknown as Record<string, string>)
			});
		} catch {
			//-- ignore revoke errors, still clear locally --
		}
	}
	clearToken();
	goto('/', { replaceState: true });
}
