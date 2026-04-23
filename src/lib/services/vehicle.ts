import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchVehicleListResponse =
	operations['fetch_vehicle_executive_company_vehicle_get']['responses'][200]['content']['application/json'];

export type CreateVehicleResponse =
	operations['create_vehicle_executive_company_vehicle_post']['responses'][201]['content']['application/json'];
export type CreateVehicleRequest =
	operations['create_vehicle_executive_company_vehicle_post']['requestBody']['content']['application/json'];

export type UpdateVehicleRequest =
	operations['update_vehicle_executive_company_vehicle__id__patch']['requestBody']['content']['application/json'];
export type UpdateVehicleResponse =
	operations['update_vehicle_executive_company_vehicle__id__patch']['responses'][200]['content']['application/json'];

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

//-- Create Vehicle --
export async function createVehicle(payload: CreateVehicleRequest): Promise<CreateVehicleResponse> {
	const url = `/company/vehicle`;
	const res = await apiFetch<CreateVehicleResponse>('POST', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as CreateVehicleResponse;
}

//-- Update Vehicle --
export async function updateVehicle(
	id: number,
	payload: UpdateVehicleRequest
): Promise<UpdateVehicleResponse> {
	const url = `/company/vehicle/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<UpdateVehicleResponse>('PATCH', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as UpdateVehicleResponse;
}

//-- Delete Vehicle --
export async function deleteVehicle(id: number): Promise<DeleteVehicleResponse> {
	const url = `/company/vehicle/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<DeleteVehicleResponse>('DELETE', url);
	if (!res.ok) throw res;
	return res.data ?? null;
}
