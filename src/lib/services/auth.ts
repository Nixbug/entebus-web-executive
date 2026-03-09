import { TokenApi } from '$lib/api/apis/TokenApi';
import { Configuration, ResponseError } from '$lib/api/runtime';
import { API_BASE_URL } from '$lib/services/config';
import { Store } from '$lib/stores/session-store';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import type { ExecutiveToken } from '$lib/types/type';

const config = new Configuration({
	basePath: API_BASE_URL
});
const tokenApi = new TokenApi(config);

export const login = async (username: string, password: string) => {
	return await tokenApi.createTokenEntebusAccountTokenPost({
		username,
		password,
		grantType: 'password'
	});
};

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
		const api = new TokenApi(
			new Configuration({
				basePath: API_BASE_URL,
				accessToken: () => `Bearer ${token.accessToken}`
			})
		);
		await api.fetchTokenEntebusAccountTokenGet();
		Store.storeData('token', JSON.stringify(token));
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
		//-- Network/server error — keep token, let user proceed --
		Store.storeData('token', JSON.stringify(token));
		goto('/dashboard', { replaceState: true });
		return true;
	}
}

//-- check if user is authenticated (used on protected pages) --
export async function requireAuth(): Promise<boolean> {
	const token = getToken();
	if (!token) {
		goto('/', { replaceState: true });
		return false;
	}
	try {
		const api = new TokenApi(
			new Configuration({
				basePath: API_BASE_URL,
				accessToken: () => `Bearer ${token.accessToken}`
			})
		);
		await api.fetchTokenEntebusAccountTokenGet();
		Store.storeData('token', JSON.stringify(token));
		return true;
	} catch (err) {
		if (
			err instanceof ResponseError &&
			(err.response.status === 401 || err.response.status === 403)
		) {
			clearToken();
			goto('/', { replaceState: true });
			return false;
		}
		// Network/server error — keep token, let user stay
		return true;
	}
}

//-- clear token --
function clearToken() {
	localStorage.removeItem('token');
	sessionStorage.removeItem('token');
	Store.clearData('token');
}

//-- logout --
export function logout() {
	clearToken();
	goto('/', { replaceState: true });
}
