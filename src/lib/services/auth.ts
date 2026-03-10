import { TokenApi } from '$lib/api/apis/TokenApi';
import { Configuration, ResponseError } from '$lib/api/runtime';
import { API_BASE_URL } from '$lib/services/config';
import { Store } from '$lib/stores/session-store';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import type { ExecutiveToken } from '$lib/types/type';

//-- auth service for login, token management, and logout --
const config = new Configuration({
	basePath: API_BASE_URL
});
//-- API client instance for auth-related calls --
const tokenApi = new TokenApi(config);
export function getClientDetails() {
	if (typeof navigator === 'undefined') return null;
	return {
		userAgent: navigator.userAgent || ''
	};
}
//-- login function --
export const login = async (username: string, password: string, clientDetails: string) => {
	return await tokenApi.createTokenEntebusAccountTokenPost({
		username,
		password,
		clientDetails,
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

//-- clear token --
function clearToken() {
	localStorage.removeItem('token');
	sessionStorage.removeItem('token');
	Store.clearData('token');
}

//-- logout --
export async function logout() {
	const token = getToken();
	if (token?.accessToken && token?.id != null) {
		try {
			const api = new TokenApi(
				new Configuration({
					basePath: API_BASE_URL,
					accessToken: () => `Bearer ${token.accessToken}`
				})
			);

			await api.deleteTokenEntebusAccountTokenIdDelete({ id: token.id });
			console.log('Token invalidated successfully', token.id);
		} catch (err) {
			console.error('Error invalidating token:', err);
		}
	}
	clearToken();
	await goto('/', { replaceState: true });
}
