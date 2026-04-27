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
	const blob = await res.blob();
	return blob;
}

//-- download image as data URL (base64) --
export async function fetchVehicleImageDataUrl(
	id: number,
	opts: { width?: number; height?: number } = {}
): Promise<string> {
	const blob = await downloadVehicleImageBlob(id, opts);
	return await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error('Failed to convert image to data URL'));
		reader.readAsDataURL(blob);
	});
}

// -- Simple in-memory cache keyed by vehicle id
type VehicleImageCacheEntry = {
	imageId: number;
	dataUrl: string;
	width?: number;
	height?: number;
	fetchedAt: number;
};

const vehicleImageCache = new Map<number, VehicleImageCacheEntry>();

/**
 * Fetch a vehicle's image as a data URL, but reuse a cached copy when the
 * server image id hasn't changed. This avoids repeated download calls.
 *
 * Returns `string` data URL when an image exists, or `null` when no image.
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
		vehicleImageCache.delete(vehicleId);
		return null;
	}

	const imgMeta = items[0] as any;
	const id = Number(imgMeta?.id);
	if (!id || Number.isNaN(id)) return null;

	const cached = vehicleImageCache.get(vehicleId);
	if (
		cached &&
		cached.imageId === id &&
		cached.width === opts.width &&
		cached.height === opts.height &&
		cached.dataUrl
	) {
		return cached.dataUrl;
	}

	// -- not cached or changed; download and update cache
	const dataUrl = await fetchVehicleImageDataUrl(id, opts);
	vehicleImageCache.set(vehicleId, {
		imageId: id,
		dataUrl,
		width: opts.width,
		height: opts.height,
		fetchedAt: Date.now()
	});
	return dataUrl;
}

export function clearVehicleImageCache(vehicleId?: number) {
	if (vehicleId === undefined) {
		vehicleImageCache.clear();
	} else {
		vehicleImageCache.delete(vehicleId);
	}
}
