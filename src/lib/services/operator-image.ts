import { apiFetch } from '$lib/services/fetch-client';
import { getToken } from '$lib/services/auth';
import { API_BASE_URL } from '$lib/services/config';
import type { operations } from '$lib/api/types';

export type FetchOperatorImageListResponse =
	operations['fetch_operator_image_for_executive_company_account_picture_get']['responses'][200]['content']['application/json'];

//-- operator image fetch --
export async function fetchOperatorImage({
	operator_id
}: {
	operator_id?: number;
} = {}): Promise<FetchOperatorImageListResponse> {
	const params = new URLSearchParams();
	if (operator_id !== undefined) params.append('operator_id', String(operator_id));
	const query = params.toString();
	const url = `/company/account/picture${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchOperatorImageListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}

//-- download image as Blob (supports width/height query params) --
export async function downloadOperatorImageBlob(
	id: number,
	opts: { width?: number; height?: number } = {}
): Promise<Blob> {
	const params = new URLSearchParams();
	if (opts.width !== undefined) params.append('width', String(opts.width));
	if (opts.height !== undefined) params.append('height', String(opts.height));
	const query = params.toString();
	const url =
		API_BASE_URL.replace(/\/$/, '') +
		`/company/account/picture/${encodeURIComponent(String(id))}${query ? `?${query}` : ''}`;

	const token = getToken()?.access_token ?? null;
	const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
	if (!res.ok) throw res;
	return res.blob();
}

//-- download image as object URL --
export async function fetchOperatorImageObjectUrl(
	id: number,
	opts: { width?: number; height?: number } = {}
): Promise<string> {
	const blob = await downloadOperatorImageBlob(id, opts);
	return URL.createObjectURL(blob);
}

// -- Simple in-memory cache keyed by operator id
type OperatorImageCacheEntry = {
	imageId: number;
	objectUrl: string;
	width?: number;
	height?: number;
	fetchedAt: number;
};

const operatorImageCache = new Map<number, OperatorImageCacheEntry>();

/**
 * Fetch an operator's image as an object URL, but reuse a cached copy when the
 * server image id hasn't changed. This avoids repeated download calls.
 *
 * Returns `string` object URL when an image exists, or `null` when no image.
 */
export async function fetchOperatorImageForOperator(
	operatorId: number,
	opts: { width?: number; height?: number } = {}
): Promise<string | null> {
	if (!operatorId || Number.isNaN(operatorId)) return null;

	// -- get list of images for this operator
	const list = await fetchOperatorImage({ operator_id: operatorId });
	const items = Array.isArray(list) ? list : list && (list as any).data ? (list as any).data : [];
	if (!items || items.length === 0) {
		evictCache(operatorId);
		return null;
	}

	const matchedItems = items.filter((it: any) => Number(it?.operator_id) === operatorId);

	const hasOperatorIdField = items.some(
		(it: any) => it?.operator_id != null && !Number.isNaN(Number(it.operator_id))
	);

	const imgMeta =
		matchedItems.length > 0
			? matchedItems[0]
			: !hasOperatorIdField && items.length === 1
				? items[0] // API doesn't return operator_id, safe single-item fallback
				: null; // no match + multi-item = wrong operator + no risk, bail out

	if (!imgMeta) {
		evictCache(operatorId);
		return null;
	}

	const id = Number((imgMeta as any)?.id);
	if (!id || Number.isNaN(id)) {
		evictCache(operatorId);
		return null;
	}

	const cached = operatorImageCache.get(operatorId);
	if (
		cached &&
		cached.imageId === id &&
		cached.width === opts.width &&
		cached.height === opts.height &&
		cached.objectUrl
	) {
		return cached.objectUrl;
	}

	// -- revoke old object URL before replacing
	if (cached?.objectUrl) URL.revokeObjectURL(cached.objectUrl);

	// -- not cached or changed; download and update cache
	const objectUrl = await fetchOperatorImageObjectUrl(id, opts);
	operatorImageCache.set(operatorId, {
		imageId: id,
		objectUrl,
		width: opts.width,
		height: opts.height,
		fetchedAt: Date.now()
	});
	return objectUrl;
}

function evictCache(operatorId: number) {
	const cached = operatorImageCache.get(operatorId);
	if (cached?.objectUrl) URL.revokeObjectURL(cached.objectUrl);
	operatorImageCache.delete(operatorId);
}

export function clearOperatorImageCache(operatorId?: number) {
	if (operatorId === undefined) {
		for (const entry of operatorImageCache.values()) {
			URL.revokeObjectURL(entry.objectUrl);
		}
		operatorImageCache.clear();
	} else {
		evictCache(operatorId);
	}
}

// -- Delete an operator image by id. Uses `apiFetch` so token refresh behavior
// -- is consistent with other API calls.
export async function deleteOperatorImage(id: number): Promise<void> {
	if (!Number.isInteger(id) || id <= 0) {
		throw new TypeError(
			`deleteOperatorImage requires a valid positive integer id, received: ${id}`
		);
	}
	const res = await apiFetch<void>(
		'DELETE',
		`/company/account/picture/${encodeURIComponent(String(id))}`
	);
	if (!res.ok) throw res;
}

// -- Upload operator image using multipart/form-data. Returns parsed JSON from server.
export async function uploadOperatorImage(
	file: File,
	operator_id: number,
	company_id: number
): Promise<any> {
	const form = new FormData();
	form.append('file', file);
	form.append('operator_id', String(operator_id));
	form.append('company_id', String(company_id));

	const res = await apiFetch<any>('POST', '/company/account/picture', {
		contentType: 'multipart',
		body: form
	});
	if (!res.ok) throw res;
	return res.data;
}
