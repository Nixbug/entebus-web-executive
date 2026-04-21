import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchVehicleListResponse =
	operations['fetch_vehicle_executive_company_vehicle_get']['responses'][200]['content']['application/json'];

export type FetchVehicleImageListResponse =
	operations['fetch_vehicle_image_for_executive_company_vehicle_picture_get']['responses'][200]['content']['application/json'];

export type DownloadVehicleImageResponse =
	operations['download_vehicle_image_for_executive_company_vehicle_picture__id__get']['responses'][200]['content']['application/json'];

export type DeleteVehicleResponse = null;

//-- Fetch Vehicle List --
export async function fetchVehicleList({
	search,
	status,
	limit,
	company_id,
	offset
}: {
	search?: string;
	status?: number;
	company_id?: number;
	limit?: number;
	offset?: number;
} = {}): Promise<FetchVehicleListResponse> {
	const params = new URLSearchParams();
	if (search) params.append('search', search);
	if (status !== undefined) params.append('status_list', String(status));
	if (company_id !== undefined) params.append('company_id', String(company_id));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/company/vehicle${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchVehicleListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}

//-- Delete Vehicle --
export async function deleteVehicle(id: number): Promise<DeleteVehicleResponse> {
	const url = `/company/vehicle/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<DeleteVehicleResponse>('DELETE', url);
	if (!res.ok) throw res;
	return res.data ?? null;
}

//-- vehicle image fetch --
export async function fetchVehicleImage({
	vehicle_id
}: {
	vehicle_id?: number;
} = {}): Promise<FetchVehicleListResponse> {
	const params = new URLSearchParams();
	if (vehicle_id !== undefined) params.append('vehicle_id', String(vehicle_id));
	const query = params.toString();
	const url = `/company/vehicle/picture${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchVehicleListResponse>('GET', url);
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
