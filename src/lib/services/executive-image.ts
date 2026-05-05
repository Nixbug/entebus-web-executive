import { apiFetch } from '$lib/services/fetch-client';
import { getToken } from '$lib/services/auth';
import { API_BASE_URL } from '$lib/services/config';
import type { operations } from '$lib/api/types';

export type FetchExecutiveImageListResponse =
	operations['fetch_executive_image_entebus_account_picture_get']['responses'][200]['content']['application/json'];

//-- executive image fetch --
export async function fetchExecutiveImage({
	executive_id
}: {
	executive_id?: number;
} = {}): Promise<FetchExecutiveImageListResponse> {
	const params = new URLSearchParams();
	if (executive_id !== undefined) params.append('executive_id', String(executive_id));
	const query = params.toString();
	const url = `/entebus/account/picture${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchExecutiveImageListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}

//-- download image as Blob (supports width/height query params) --
export async function downloadExecutiveImageBlob(
	id: number,
	opts: { width?: number; height?: number } = {}
): Promise<Blob> {
	const params = new URLSearchParams();
	if (opts.width !== undefined) params.append('width', String(opts.width));
	if (opts.height !== undefined) params.append('height', String(opts.height));
	const query = params.toString();
	const url =
		API_BASE_URL.replace(/\/$/, '') +
		`/entebus/account/picture/${encodeURIComponent(String(id))}${query ? `?${query}` : ''}`;

	const token = getToken()?.access_token ?? null;
	const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
	if (!res.ok) throw res;
	return res.blob();
}

//-- download image as object URL --
export async function fetchExecutiveImageObjectUrl(
	id: number,
	opts: { width?: number; height?: number } = {}
): Promise<string> {
	const blob = await downloadExecutiveImageBlob(id, opts);
	return URL.createObjectURL(blob);
}

// -- Simple in-memory cache keyed by executive id
type ExecutiveImageCacheEntry = {
	imageId: number;
	objectUrl: string;
	width?: number;
	height?: number;
	fetchedAt: number;
};

const executiveImageCache = new Map<number, ExecutiveImageCacheEntry>();

/**
 * Fetch an executive's image as an object URL, but reuse a cached copy when the
 * server image id hasn't changed. This avoids repeated download calls.
 *
 * Returns `string` object URL when an image exists, or `null` when no image.
 */
export async function fetchExecutiveImageForExecutive(
	executiveId: number,
	opts: { width?: number; height?: number } = {}
): Promise<string | null> {
	if (!executiveId || Number.isNaN(executiveId)) return null;

	// -- get list of images for this executive
	const list = await fetchExecutiveImage({ executive_id: executiveId });
	const items = Array.isArray(list) ? list : list && (list as any).data ? (list as any).data : [];
	if (!items || items.length === 0) {
		evictCache(executiveId);
		return null;
	}

	const matchedItems = items.filter((it: any) => Number(it?.executive_id) === executiveId);

	const hasExecutiveIdField = items.some(
		(it: any) => it?.executive_id != null && !Number.isNaN(Number(it.executive_id))
	);

	const imgMeta =
		matchedItems.length > 0
			? matchedItems[0]
			: !hasExecutiveIdField && items.length === 1
				? items[0] // API doesn't return executive_id, safe single-item fallback
				: null; // no match + multi-item = wrong executive + no risk, bail out

	if (!imgMeta) {
		evictCache(executiveId);
		return null;
	}

	const id = Number((imgMeta as any)?.id);
	if (!id || Number.isNaN(id)) {
		evictCache(executiveId);
		return null;
	}

	const cached = executiveImageCache.get(executiveId);
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
	const objectUrl = await fetchExecutiveImageObjectUrl(id, opts);
	executiveImageCache.set(executiveId, {
		imageId: id,
		objectUrl,
		width: opts.width,
		height: opts.height,
		fetchedAt: Date.now()
	});
	return objectUrl;
}

function evictCache(executiveId: number) {
	const cached = executiveImageCache.get(executiveId);
	if (cached?.objectUrl) URL.revokeObjectURL(cached.objectUrl);
	executiveImageCache.delete(executiveId);
}

export function clearExecutiveImageCache(executiveId?: number) {
	if (executiveId === undefined) {
		for (const entry of executiveImageCache.values()) {
			URL.revokeObjectURL(entry.objectUrl);
		}
		executiveImageCache.clear();
	} else {
		evictCache(executiveId);
	}
}

// -- Delete an executive image by id. Uses `apiFetch` so token refresh behavior
// -- is consistent with other API calls.
export async function deleteExecutiveImage(id: number): Promise<void> {
	if (!Number.isInteger(id) || id <= 0) {
		throw new TypeError(
			`deleteExecutiveImage requires a valid positive integer id, received: ${id}`
		);
	}
	const res = await apiFetch<void>(
		'DELETE',
		`/entebus/account/picture/${encodeURIComponent(String(id))}`
	);
	if (!res.ok) throw res;
}

// -- Upload executive image using multipart/form-data. Returns parsed JSON from server.
export async function uploadExecutiveImage(
	file: File,
	executive_id: number,
): Promise<any> {
	const form = new FormData();
	form.append('file', file);
	form.append('executive_id', String(executive_id));

	const res = await apiFetch<any>('POST', '/entebus/account/picture', {
		contentType: 'multipart',
		body: form
	});
	if (!res.ok) throw res;
	return res.data;
}
