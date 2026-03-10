import { TokenApi } from '$lib/api/apis/TokenApi';
import { Configuration, ResponseError } from '$lib/api/runtime';
import { API_BASE_URL } from '$lib/services/config';
import { Store } from '$lib/stores/session-store';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import type { ExecutiveToken } from '$lib/types/type';
import toast from '$lib/utils/toast';

const tokenApi = new TokenApi(new Configuration({ basePath: API_BASE_URL }));

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

//-- browser/device info for login --
export function getClientDetails() {
	if (typeof navigator === 'undefined') return null;
	return { userAgent: navigator.userAgent || '' };
}

//-- login --
export const login = async (username: string, password: string, clientDetails: string) => {
	return await tokenApi.createTokenEntebusAccountTokenPost({
		username,
		password,
		clientDetails,
		grantType: 'password'
	});
};

//-- read token from storage --
export function getToken(): ExecutiveToken | null {
	if (!browser) return null;
	const raw = localStorage.getItem('token') || sessionStorage.getItem('token');
	if (!raw) return null;
	try {
		return JSON.parse(raw) as ExecutiveToken;
	} catch {
		return null;
	}
}

//-- save token + schedule auto-refresh --
export function storeToken(token: ExecutiveToken, rememberMe: boolean = false) {
	const tokenString = JSON.stringify(token);
	Store.storeData('token', tokenString);
	if (rememberMe || localStorage.getItem('token')) {
		localStorage.setItem('token', tokenString);
	}
	scheduleTokenRefresh(token);
}

//-- clear everything --
function clearToken() {
	if (refreshTimer) {
		clearTimeout(refreshTimer);
		refreshTimer = null;
	}
	localStorage.removeItem('token');
	sessionStorage.removeItem('token');
	Store.clearData('token');
}

//-- schedule refresh 5 minutes before access token expires --
function scheduleTokenRefresh(token: ExecutiveToken) {
	if (refreshTimer) clearTimeout(refreshTimer);

	const createdAt = new Date(token.createdOn).getTime();
	const expiryTime = createdAt + token.expiresIn * 1000;
	const delay = Math.max(0, expiryTime - 5 * 60 * 1000 - Date.now());

	refreshTimer = setTimeout(async () => {
		const current = getToken();
		if (!current?.refreshToken) return;
		try {
			const res = await tokenApi.refreshTokenEntebusAccountTokenRefreshPost({
				refreshToken: current.refreshToken,
				grantType: 'refresh_token'
			});

			//-- storeToken will also schedule the next refresh --
			storeToken({
				id: res.id,
				executiveId: res.executiveId,
				accessToken: res.accessToken,
				refreshToken: res.refreshToken,
				expiresIn: res.expiresIn,
				refreshBefore: res.refreshBefore.toISOString(),
				platformType: res.platformType,
				tokenType: res.tokenType ?? 'bearer',
				createdOn: res.createdOn.toISOString(),
				clientDetails: res.clientDetails
			});
		} catch {
			//-- refresh failed → session expired → force logout --
			clearToken();
			goto('/', { replaceState: true });
		}
	}, delay);
}

//-- check if stored token is still valid (used on login page load) --
export async function validateToken(): Promise<boolean> {
	const token = getToken();
	if (!token) return false;
	try {
		const api = new TokenApi(
			new Configuration({
				basePath: API_BASE_URL,
				accessToken: () => `Bearer ${token.accessToken}`
			})
		);
		await api.fetchTokenEntebusAccountTokenGet();
		storeToken(token);
		goto('/dashboard', { replaceState: true });
		return true;
	} catch (err) {
		if (
			err instanceof ResponseError &&
			(err.response.status === 401 || err.response.status === 403)
		) {
			clearToken();
			return false;
		}
		//-- network error — keep token, let user proceed --
		storeToken(token);
		goto('/dashboard', { replaceState: true });
		return true;
	}
}

//-- logout: revoke on server, then clear locally --
export async function logout() {
	const token = getToken();
	if (token?.accessToken) {
		try {
			const api = new TokenApi(
				new Configuration({
					basePath: API_BASE_URL,
					accessToken: () => `Bearer ${token.accessToken}`
				})
			);
			await api.revokeTokenEntebusAccountTokenRevokePost({ token: token.accessToken });
		} catch {
			toast.error('Logout failed. Please try again.');
		}
	}
	clearToken();
	await goto('/', { replaceState: true });
}
