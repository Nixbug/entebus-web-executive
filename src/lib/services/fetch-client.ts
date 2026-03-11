import { API_BASE_URL } from '$lib/services/config';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiResult<T = unknown> = {
	ok: boolean;
	status: number;
	data: T | null;
};

function buildUrl(path: string): string {
	//-- Removes trailing slash from base, then joins --
	return API_BASE_URL.replace(/\/$/, '') + path;
}

//-- Converts an object to URLSearchParams, skipping undefined/null values --
export function toFormBody(obj: Record<string, unknown>): URLSearchParams {
	const params = new URLSearchParams();
	for (const [k, v] of Object.entries(obj)) {
		if (v !== undefined && v !== null) params.append(k, String(v));
	}
	return params;
}

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

	return { ok: res.ok, status: res.status, data };
}
