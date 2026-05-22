import { apiFetch } from '$lib/services/fetch-client';
import { getToken } from '$lib/services/auth';
import { API_BASE_URL } from '$lib/services/config';
import type { operations } from '$lib/api/types';

export type FetchVehicleImageListResponse =
	operations['fetch_vehicle_image_for_executive_company_vehicle_picture_get']['responses'][200]['content']['application/json'];

//-- vehicle image fetch --
export async function fetchVehicleImage({
	vehicle_id
}: {
	vehicle_id?: number;
} = {}): Promise<FetchVehicleImageListResponse> {
	const params = new URLSearchParams();
	if (vehicle_id !== undefined) params.append('vehicle_id', String(vehicle_id));
	const query = params.toString();
	const url = `/company/vehicle/picture${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchVehicleImageListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}

//-- download image as Blob (supports width/height query params) --
export async function downloadVehicleImageBlob(
	id: number,
	opts: { width?: number; height?: number } = {}
): Promise<Blob> {
	const params = new URLSearchParams();
	if (opts.width !== undefined) params.append('width', String(opts.width));
	if (opts.height !== undefined) params.append('height', String(opts.height));
	const query = params.toString();
	const url =
		API_BASE_URL.replace(/\/$/, '') +
		`/company/vehicle/picture/${encodeURIComponent(String(id))}${query ? `?${query}` : ''}`;

	const token = getToken()?.access_token ?? null;
	const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
	if (!res.ok) throw res;
	return res.blob();
}

//-- download image as object URL --
export async function fetchVehicleImageObjectUrl(
	id: number,
	opts: { width?: number; height?: number } = {}
): Promise<string> {
	const blob = await downloadVehicleImageBlob(id, opts);
	return URL.createObjectURL(blob);
}

// -- Simple in-memory cache keyed by vehicle id
type VehicleImageCacheEntry = {
	imageId: number;
	objectUrl: string;
	width?: number;
	height?: number;
	fetchedAt: number;
};

const vehicleImageCache = new Map<number, VehicleImageCacheEntry>();

/**
 * Fetch a vehicle's image as an object URL, but reuse a cached copy when the
 * server image id hasn't changed. This avoids repeated download calls.
 *
 * Returns `string` object URL when an image exists, or `null` when no image.
 */
export async function fetchVehicleImageForVehicle(
	vehicleId: number,
	opts: { width?: number; height?: number } = {}
): Promise<string | null> {
	if (!vehicleId || Number.isNaN(vehicleId)) return null;

	// -- get list of images for this vehicle
	const list = await fetchVehicleImage({ vehicle_id: vehicleId });
	const items = Array.isArray(list) ? list : list && (list as any).data ? (list as any).data : [];
	if (!items || items.length === 0) {
		evictCache(vehicleId);
		return null;
	}

	const matchedItems = items.filter((it: any) => Number(it?.vehicle_id) === vehicleId);

	// -- STRICT: Only use the first matched item. Never use fallback if field is missing
	// -- to avoid mixing up different vehicles' images --
	const imgMeta =
		matchedItems.length > 0
			? matchedItems[0]
			: null; // no match = no image for this vehicle (safer than risky fallback)

	if (!imgMeta) {
		evictCache(vehicleId);
		return null;
	}

	const id = Number((imgMeta as any)?.id);
	if (!id || Number.isNaN(id)) {
		evictCache(vehicleId);
		return null;
	}

	const cached = vehicleImageCache.get(vehicleId);
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
	const objectUrl = await fetchVehicleImageObjectUrl(id, opts);
	vehicleImageCache.set(vehicleId, {
		imageId: id,
		objectUrl,
		width: opts.width,
		height: opts.height,
		fetchedAt: Date.now()
	});
	return objectUrl;
}

function evictCache(vehicleId: number) {
	const cached = vehicleImageCache.get(vehicleId);
	if (cached?.objectUrl) URL.revokeObjectURL(cached.objectUrl);
	vehicleImageCache.delete(vehicleId);
}

export function clearVehicleImageCache(vehicleId?: number) {
	if (vehicleId === undefined) {
		for (const entry of vehicleImageCache.values()) {
			URL.revokeObjectURL(entry.objectUrl);
		}
		vehicleImageCache.clear();
	} else {
		evictCache(vehicleId);
	}
}

// -- Delete a vehicle image by id. Uses `apiFetch` so token refresh behavior
// -- is consistent with other API calls.
export async function deleteVehicleImage(id: number): Promise<void> {
	if (!Number.isInteger(id) || id <= 0) {
		throw new TypeError(`deleteVehicleImage requires a valid positive integer id, received: ${id}`);
	}
	const res = await apiFetch<void>(
		'DELETE',
		`/company/vehicle/picture/${encodeURIComponent(String(id))}`
	);
	if (!res.ok) throw res;
}

// -- Upload vehicle image using multipart/form-data. Returns parsed JSON from server.
export async function uploadVehicleImage(
	file: File,
	vehicle_id: number,
	company_id: number
): Promise<any> {
	const form = new FormData();
	form.append('file', file);
	form.append('vehicle_id', String(vehicle_id));
	form.append('company_id', String(company_id));

	const res = await apiFetch<any>('POST', '/company/vehicle/picture', {
		contentType: 'multipart',
		body: form
	});
	if (!res.ok) throw res;
	return res.data;
}
