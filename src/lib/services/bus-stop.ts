import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchBusStopListResponse =
	operations['fetch_bus_stop_executive_landmark_bus_stop_get']['responses'][200]['content']['application/json'];

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
