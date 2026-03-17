import { API_BASE_URL } from '$lib/services/config';
import { browser } from '$app/environment';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type InvalidSessionHandler = () => void;

let invalidSessionHandled = false;
let invalidSessionHandler: InvalidSessionHandler | null = null;

//-- Register handler from auth layer so full cleanup (timers + storage + redirect) can happen centrally --
export function registerInvalidSessionHandler(handler: InvalidSessionHandler | null) {
	invalidSessionHandler = handler;
}

//-- Registered by auth.ts: supplies the current access token --
let _getToken: () => string | null = () => null;

//-- Registered by auth.ts: performs a token refresh, returns new access token or null --
let _refreshToken: (() => Promise<string | null>) | null = null;

//-- Single in-flight refresh promise — concurrent 401s share one refresh attempt --
let _refreshInFlight: Promise<string | null> | null = null;

export function registerTokenProvider(fn: () => string | null) {
	_getToken = fn;
}

export function registerRefreshCallback(fn: () => Promise<string | null>) {
	_refreshToken = fn;
}

//-- Dedupes concurrent refresh calls: only one refresh runs at a time --
function dedupeRefresh(): Promise<string | null> {
	if (_refreshInFlight) return _refreshInFlight;
	if (!_refreshToken) return Promise.resolve(null);
	_refreshInFlight = _refreshToken().finally(() => {
		_refreshInFlight = null;
	});
	return _refreshInFlight;
}

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

function handleInvalidSessionGlobally() {
	if (invalidSessionHandled) return;
	invalidSessionHandled = true;

	if (invalidSessionHandler) {
		try {
			invalidSessionHandler();
		} finally {
			// allow subsequent invalid-session events after a short debounce
			setTimeout(() => {
				invalidSessionHandled = false;
			}, 1000);
		}
		return;
	}

	// No handler registered — emit a console warning and debounce further events.
	// The application should register a handler via `registerInvalidSessionHandler`
	// to perform navigation, storage cleanup and user notification.
	if (browser) console.warn('Invalid session detected but no handler is registered.');
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
 * Supports sending a body in either JSON or form-encoded format.
 *
 * Token behaviour (accessToken option):
 *   - undefined (not provided) → auto mode: injects current token automatically;
 *     on 401 attempts a single deduped refresh then retries the request once.
 *   - null   → no Authorization header, no retry (use for login / public endpoints).
 *   - string → uses that exact token, no retry (use for internal auth calls).
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

	//-- auto mode when accessToken is absent; null = no auth; string = explicit token --
	const isAutoMode = options?.accessToken === undefined;
	const isNoAuth = options?.accessToken === null;
	const token = isAutoMode ? _getToken() : (options?.accessToken ?? null);

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const url = buildUrl(path);
	const { result, xError } = await doFetch<T>(method, url, headers, body);

	//-- auto mode: on 401 attempt a single deduped refresh then retry once --
	if (isAutoMode) {
		// If server reports invalid token via structured response (401/403), sign out.
		if (isInvalidTokenResponse(result.status, result.data, xError) && result.status !== 401) {
			handleInvalidSessionGlobally();
			return result;
		}

		// Only attempt refresh when we received a 401. If refresh succeeds, retry once.
		if (result.status === 401) {
			const newToken = await dedupeRefresh();
			if (newToken) {
				const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
				const { result: retryResult, xError: retryXError } = await doFetch<T>(
					method,
					url,
					retryHeaders,
					body
				);
				if (isInvalidTokenResponse(retryResult.status, retryResult.data, retryXError)) {
					handleInvalidSessionGlobally();
				}
				return retryResult;
			}
			//-- refresh failed — sign user out --
			handleInvalidSessionGlobally();
			return result;
		}
	}

	//-- explicit token (not null): trigger global handler on invalid token responses --
	if (!isAutoMode && !isNoAuth && isInvalidTokenResponse(result.status, result.data, xError)) {
		handleInvalidSessionGlobally();
	}

	return result;
}
