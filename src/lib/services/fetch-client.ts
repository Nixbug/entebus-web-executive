import { API_BASE_URL } from '$lib/services/config';
import { browser } from '$app/environment';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; //-- Type definitions for API responses and handlers --
type InvalidSessionHandler = () => void; //-- Handler for global invalid session events, registered by auth layer --

let invalidSessionHandled = false; //-- Debounce flag to prevent multiple simultaneous invalid session handling --
let invalidSessionHandler: InvalidSessionHandler | null = null; //-- Registers a handler for invalid session events, allowing centralized cleanup and navigation on token expiry or invalidation --

//-- Register handler from auth layer so full cleanup (timers + storage + redirect) can happen centrally --
export function registerInvalidSessionHandler(handler: InvalidSessionHandler | null) {
	invalidSessionHandler = handler;
}

let _getToken: () => string | null = () => null; //-- Registered by auth.ts: provides current access token for API calls --

export function registerTokenProvider(tokenProvider: () => string | null) {
	_getToken = tokenProvider;
}

//-- Determines if an API response indicates an invalid token, based on status code, response body and headers --
function isInvalidTokenResponse(
	status: number,
	body: unknown,
	errorHeader: string | null
): boolean {
	if (status !== 401 && status !== 403) return false;
	if (typeof errorHeader === 'string' && errorHeader.toLowerCase() === 'invalidtoken') return true;
	if (!body || typeof body !== 'object') return false;
	const detail = (body as { detail?: unknown }).detail;
	return typeof detail === 'string' && detail.toLowerCase().includes('invalid token');
}

//-- Global handler for invalid sessions: debounced to prevent multiple rapid calls, and allows centralized handling via registered handler --
function handleInvalidSessionGlobally() {
	if (invalidSessionHandled) return;
	invalidSessionHandled = true;

	if (invalidSessionHandler) {
		try {
			invalidSessionHandler();
		} finally {
			setTimeout(() => {
				invalidSessionHandled = false;
			}, 1000);
		}
		return;
	}

	//-- If no handler is registered, log a warning (in browser) and reset the debounce after a short delay --
	if (browser) console.warn('Invalid session detected but no handler is registered.');
	setTimeout(() => {
		invalidSessionHandled = false;
	}, 1000);
}

//-- ApiResult type definition for consistent API response handling across the app --
export type ApiResult<T = unknown> = {
	ok: boolean;
	status: number;
	data: T | null;
	sessionExpired?: boolean;
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

//-- Makes a request to the API with the given method, path, and options --
async function doFetch<T>(
	method: Method,
	url: string,
	headers: Record<string, string>,
	body: BodyInit | undefined
): Promise<{ result: ApiResult<T>; xError: string | null }> {
	const res = await fetch(url, { method, headers, body });
	let data: T | null = null;
	try {
		const ct = res.headers.get('content-type') ?? '';
		if (ct.includes('application/json')) {
			data = (await res.json()) as T;
		}
	} catch {
		//-- non-JSON or empty body — data stays null --
	}
	return { result: { ok: res.ok, status: res.status, data }, xError: res.headers.get('x-error') };
}

/**
 * Makes a request to the API with the given method, path, and options.
 * Auto mode injects the current token and handles invalid token responses globally.
 * No-auth mode sends no Authorization header and does not retry on invalid token responses.
 * Explicitly provided tokens are used for the request.
 * @param {Method} method - HTTP method to use for the request
 * @param {string} path - API path to make the request to
 * @param {object} options - Optional parameters to customize the request
 * @param {Record<string, unknown>} options.body - Request body to send with the request
 * @param {'json'|'form'} options.contentType - Content type of the request body
 * @param {string|null} options.accessToken - Token to use for the request; if null, no token is sent
 * @returns {Promise<ApiResult<T>>} - Promise resolving to the API response
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

	//-- auto mode if accessToken is not explicitly provided; in this mode the client will inject the current token and handle invalid token responses globally --
	const isAutoMode = options?.accessToken === undefined;
	//-- no-auth mode if accessToken is explicitly null: in this mode no Authorization header will be sent and no retry will be attempted; use this for login or public endpoints --
	const isNoAuth = options?.accessToken === null;
	//-- if auto mode, inject token; if no-auth mode, no token; if explicitly provided, use that token --
	const token = isAutoMode ? _getToken() : (options?.accessToken ?? null);

	//-- if auto mode, inject token; if no-auth mode, no token; if explicitly provided, use that token --
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	//-- build full URL for API request --
	const url = buildUrl(path);
	//-- make the API request --
	const { result, xError } = await doFetch<T>(method, url, headers, body);

	//-- auto mode: on invalid token (401/403), handle as invalid session immediately --
	//-- scheduled refresh in auth.ts handles proactive token renewal before expiry --
	if (isAutoMode && isInvalidTokenResponse(result.status, result.data, xError)) {
		handleInvalidSessionGlobally();
		return { ...result, sessionExpired: true };
	}

	//-- explicit token (not null): trigger global handler on invalid token responses --
	if (!isAutoMode && !isNoAuth && isInvalidTokenResponse(result.status, result.data, xError)) {
		handleInvalidSessionGlobally();
		return { ...result, sessionExpired: true };
	}

	return result;
}
