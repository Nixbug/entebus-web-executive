import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchServiceListResponse =
	operations['fetch_service_executive_company_service_get']['responses'][200]['content']['application/json'];

export type Service = FetchServiceListResponse[number];

//-- Fetch operator role --
export async function fetchServiceList({
	name,
	id,
	company_id,
	search,
	limit,
	offset
}: {
	name?: string;
	id?: number;
	company_id?: number;
	search?: string;
	limit?: number;
	offset?: number;
} = {}): Promise<Service[]> {
	const params = new URLSearchParams();
	if (name) params.append('name', name);
	if (search) params.append('search', search);
	if (company_id !== undefined) params.append('company_id', String(company_id));
	if (id !== undefined) params.append('id', String(id));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/company/service${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchServiceListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
