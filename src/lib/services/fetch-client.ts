import { API_BASE_URL } from '$lib/services/config';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { Store } from '$lib/stores/session-store';
import toast from '$lib/utils/toast';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type InvalidSessionHandler = () => void;

let invalidSessionHandled = false;
let invalidSessionHandler: InvalidSessionHandler | null = null;

//-- Register handler from auth layer so full cleanup (timers + storage + redirect) can happen centrally --
export function registerInvalidSessionHandler(handler: InvalidSessionHandler | null) {
	invalidSessionHandler = handler;
}

function isInvalidTokenResponse(
	status: number,
	body: unknown,
	errorHeader: string | null
): boolean {
	if (status !== 401) return false;
	if (typeof errorHeader === 'string' && errorHeader.toLowerCase() === 'invalidtoken') return true;
	if (!body || typeof body !== 'object') return false;
	const detail = (body as { detail?: unknown }).detail;
	return typeof detail === 'string' && detail.toLowerCase().includes('invalid token');
}

function handleInvalidSessionGlobally() {
	if (!browser || invalidSessionHandled) return;
	invalidSessionHandled = true;

	if (invalidSessionHandler) {
		try {
			invalidSessionHandler();
		} catch {
			//-- fallback to local cleanup when custom handler fails --
			localStorage.removeItem('token');
			localStorage.removeItem('username');
			sessionStorage.removeItem('token');
			sessionStorage.removeItem('username');
			Store.clearData('token');
			toast.warning('You have been signed out. Please sign in again.');
			goto('/', { replaceState: true });
		}

		setTimeout(() => {
			invalidSessionHandled = false;
		}, 1000);
		return;
	}

	localStorage.removeItem('token');
	localStorage.removeItem('username');
	sessionStorage.removeItem('token');
	sessionStorage.removeItem('username');
	Store.clearData('token');

	toast.warning('You have been signed out. Please sign in again.');
	goto('/', { replaceState: true });

	setTimeout(() => {
		invalidSessionHandled = false;
	}, 1000);
}

export type ApiResult<T = unknown> = {
	ok: boolean;
	status: number;
	data: T | null;
};

//-- Builds full URL for API request by combining base URL and path --
function buildUrl(path: string): string {
	//-- Removes trailing slash from base, then joins --
	return API_BASE_URL.replace(/\/$/, '') + path;
}

//-- Converts an object to URLSearchParams, skipping undefined/null values --
export function toFormBody(obj: Record<string, unknown>): URLSearchParams {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(obj)) {
		if (value !== undefined && value !== null) params.append(key, String(value));
	}
	return params;
}

/**
 * Makes a request to the API with the given method, path, and options.
 * Supports sending a body in either JSON or form-encoded format.
 * If an access token is provided, it is included in the Authorization header.
 * Returns a Promise that resolves to an ApiResult object containing the response status, data, and ok flag.
 * @param {Method} method The HTTP method to use.
 * @param {string} path The path of the API endpoint to call.
 * @param {Object} [options] Optional configuration object.
 * @param {Record<string, unknown>} [options.body] Optional body to send with the request.
 * @param {string} [options.contentType] Optional content type of the body. One of 'json' or 'form'.
 * @param {string | null} [options.accessToken] Optional access token to include in the Authorization header.
 * @returns {Promise<ApiResult<T>>} A Promise that resolves to an ApiResult object containing the response status, data, and ok flag.
 */
export async function apiFetch<T = unknown>(
	method: Method,
	path: string,
	options?: {
		body?: Record<string, unknown>;
		contentType?: 'json' | 'form';
		accessToken?: string | null;
	}
): Promise<ApiResult<T>> {
	const headers: Record<string, string> = {};
	let body: BodyInit | undefined;

	if (options?.contentType === 'form' && options.body) {
		headers['Content-Type'] = 'application/x-www-form-urlencoded';
		body = toFormBody(options.body);
	} else if (options?.contentType === 'json' && options.body) {
		headers['Content-Type'] = 'application/json';
		body = JSON.stringify(options.body);
	}

	if (options?.accessToken) {
		headers['Authorization'] = `Bearer ${options.accessToken}`;
	}

	const res = await fetch(buildUrl(path), { method, headers, body });

	let data: T | null = null;
	try {
		const ct = res.headers.get('content-type') ?? '';
		if (ct.includes('application/json')) {
			data = (await res.json()) as T;
		}
	} catch {
		//-- non-JSON or empty body — data stays null --
	}

	if (isInvalidTokenResponse(res.status, data, res.headers.get('x-error'))) {
		handleInvalidSessionGlobally();
	}

	return { ok: res.ok, status: res.status, data };
}
