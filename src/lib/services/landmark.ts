import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchLandmarkListResponse =
	operations['fetch_landmark_executive_landmark_get']['responses'][200]['content']['application/json'];

export async function fetchLandmarkList({
	name,
	id,
	search,
	location,
	type,
	limit,
	offset
}: {
	name?: string;
	id?: number;
	search?: string;
	location?: string;
	type?: number;
	limit?: number;
	offset?: number;
} = {}): Promise<FetchLandmarkListResponse> {
	const params = new URLSearchParams();
	if (name) params.append('name', name);
	if (id !== undefined) params.append('id', String(id));
	if (search) params.append('search', search);
	if (location) params.append('location', location);
	if (type !== undefined) params.append('type', String(type));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/landmark${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchLandmarkListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
