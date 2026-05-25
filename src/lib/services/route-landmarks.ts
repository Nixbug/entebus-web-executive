import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';
export type FetchRouteResponse =
	operations['fetch_route_executive_company_route_get']['responses'][200]['content']['application/json'];

export type FetchLandmarkInRouteResponse =
	operations['fetch_landmark_in_route_for_executive_company_route_landmark_get']['responses'][200]['content']['application/json'];

export type CreateRouteRequest =
	operations['create_route_executive_company_route_post']['requestBody']['content']['application/json'];

export type CreateRouteResponse =
	operations['create_route_executive_company_route_post']['responses'][201]['content']['application/json'];

export type CreateLandmarkInRouteRequest =
	operations['create_landmark_in_route_for_executive_company_route_landmark_post']['requestBody']['content']['application/json'];

export type CreateLandmarkInRouteResponse =
	operations['create_landmark_in_route_for_executive_company_route_landmark_post']['responses'][201]['content']['application/json'];

export type UpdateRouteRequest =
	operations['update_route_executive_company_route__id__patch']['requestBody']['content']['application/json'];
export type UpdateRouteResponse =
	operations['update_route_executive_company_route__id__patch']['responses'][200]['content']['application/json'];

export type UpdateLandmarkInRouteRequest =
	operations['update_landmark_in_route_for_executive_company_route_landmark__id__patch']['requestBody']['content']['application/json'];
export type UpdateLandmarkInRouteResponse =
	operations['update_landmark_in_route_for_executive_company_route_landmark__id__patch']['responses'][200]['content']['application/json'];

export type DeleteRouteResponse = null;
export type DeleteRouteLandmarkResponse = null;
//-- Fetch Route --
export async function fetchRoute({
	search,
	id,
	status,
	limit,
	company_id,
	offset
}: {
	search?: string;
	id?: number;
	status?: number;
	company_id?: number;
	limit?: number;
	offset?: number;
} = {}): Promise<FetchRouteResponse> {
	const params = new URLSearchParams();
	if (search) params.append('search', search);
	if (id !== undefined) params.append('id', String(id));
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
	route_id,
	landmark_id,
	limit,
	offset
}: {
	route_id?: number;
	landmark_id?: number;
	limit?: number;
	offset?: number;
}): Promise<FetchLandmarkInRouteResponse> {
	const params = new URLSearchParams();
	if (route_id !== undefined) params.append('route_id', String(route_id));
	if (landmark_id !== undefined) params.append('landmark_id', String(landmark_id));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));
	const query = params.toString();
	const url = `/company/route/landmark${query ? `?${query}` : ''}`;
	const res = await apiFetch<FetchLandmarkInRouteResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}

//-- create route --
export async function createRoute(payload: CreateRouteRequest): Promise<CreateRouteResponse> {
	const url = `/company/route`;
	const res = await apiFetch<CreateRouteResponse>('POST', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as CreateRouteResponse;
}

//-- create landmark in route --
export async function createLandmarkInRoute(
	payload: CreateLandmarkInRouteRequest
): Promise<CreateLandmarkInRouteResponse> {
	const url = `/company/route/landmark`;
	const res = await apiFetch<CreateLandmarkInRouteResponse>('POST', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as CreateLandmarkInRouteResponse;
}

//-- update route --
export async function updateRoute(
	id: number,
	payload: UpdateRouteRequest
): Promise<UpdateRouteResponse> {
	const url = `/company/route/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<UpdateRouteResponse>('PATCH', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as UpdateRouteResponse;
}

//-- update landmark in route --
export async function updateLandmarkInRoute(
	id: number,
	payload: UpdateLandmarkInRouteRequest
): Promise<UpdateLandmarkInRouteResponse> {
	const url = `/company/route/landmark/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<UpdateLandmarkInRouteResponse>('PATCH', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as UpdateLandmarkInRouteResponse;
}
//-- Delete Route --
export async function deleteRoute(id: number): Promise<DeleteRouteResponse> {
	const url = `/company/route/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<DeleteRouteResponse>('DELETE', url);
	if (!res.ok) throw res;
	return res.data ?? null;
}

//-- Delete Route Landmark --
export async function deleteRouteLandmark(id: number): Promise<DeleteRouteLandmarkResponse> {
	const url = `/company/route/landmark/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<DeleteRouteLandmarkResponse>('DELETE', url);
	if (!res.ok) throw res;
	return res.data ?? null;
}
