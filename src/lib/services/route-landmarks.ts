import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchRouteResponse =
	operations['fetch_route_executive_company_route_get']['responses'][200]['content']['application/json'];

export type FetchLandmarkInRouteResponse =
	operations['fetch_landmark_in_route_for_executive_company_route_landmark_get']['responses'][200]['content']['application/json'];

//-- Fetch Route --
export async function fetchRoute({
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
} = {}): Promise<FetchRouteResponse> {
	const params = new URLSearchParams();
	if (search) params.append('search', search);
	if (status !== undefined) params.append('status_list', String(status));
	if (company_id !== undefined) params.append('company_id', String(company_id));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/company/route${query ? `?${query}` : ''}`;
	const res = await apiFetch<FetchRouteResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}

//-- Fetch Landmark in Route --
export async function fetchLandmarkInRoute({
	route_id
}: {
	route_id: number;
}): Promise<FetchLandmarkInRouteResponse> {
	const params = new URLSearchParams();
	params.append('route_id', String(route_id));

	const query = params.toString();
	const url = `/company/route/landmark${query ? `?${query}` : ''}`;
	const res = await apiFetch<FetchLandmarkInRouteResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
