import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchVehicleImageListResponse =
	operations['fetch_vehicle_image_for_executive_company_vehicle_picture_get']['responses'][200]['content']['application/json'];

export type DownloadVehicleImageResponse =
	operations['download_vehicle_image_for_executive_company_vehicle_picture__id__get']['responses'][200]['content']['application/json'];

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

//-- vehicle image download --
export async function downloadVehicleImage(id: number): Promise<DownloadVehicleImageResponse> {
	const url = `/company/vehicle/picture/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<DownloadVehicleImageResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data as DownloadVehicleImageResponse;
}
