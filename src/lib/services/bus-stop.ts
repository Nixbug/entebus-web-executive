import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchBusStopListResponse =
	operations['fetch_bus_stop_executive_landmark_bus_stop_get']['responses'][200]['content']['application/json'];
export type CreateBusStopRequest =
	operations['create_bus_stop_landmark_bus_stop_post']['requestBody']['content']['application/json'];
export type CreateBusStopResponse =
	operations['create_bus_stop_landmark_bus_stop_post']['responses'][201]['content']['application/json'];
export type UpdateBusStopRequest =
	operations['update_bus_stop_landmark_bus_stop__id__patch']['requestBody']['content']['application/json'];
export type UpdateBusStopResponse =
	operations['update_bus_stop_landmark_bus_stop__id__patch']['responses'][200]['content']['application/json'];

export type DeleteBusStopResponse = null;

//-- fetch bus stops by landmark id(s) --
export async function fetchBusStopByLandmark(
	landmarkIds: number | number[]
): Promise<FetchBusStopListResponse> {
	const idArray = Array.isArray(landmarkIds) ? landmarkIds : [landmarkIds];
	if (idArray.length === 0) {
		return [];
	}
	const params = new URLSearchParams();
	params.append('landmark_id_list', idArray.join(','));
	const query = params.toString();
	const url = `/landmark/bus_stop${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchBusStopListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}

//-- create bus stop --
export async function createBusStop(payload: CreateBusStopRequest): Promise<CreateBusStopResponse> {
	const res = await apiFetch<CreateBusStopResponse>('POST', '/landmark/bus_stop', {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as CreateBusStopResponse;
}

//-- update bus stop --
export async function updateBusStop(
	id: number,
	payload: UpdateBusStopRequest
): Promise<UpdateBusStopResponse> {
	const url = `/landmark/bus_stop/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<UpdateBusStopResponse>('PATCH', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as UpdateBusStopResponse;
}

//-- Delete Bus Stop --
export async function deleteBusStop(id: number): Promise<DeleteBusStopResponse> {
	const url = `/landmark/bus_stop/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<DeleteBusStopResponse>('DELETE', url);
	if (!res.ok) throw res;
	return res.data ?? null;
}
