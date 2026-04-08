import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchCompanyAccountResponse =
	operations['fetch_company_executive_company_get']['responses'][200]['content']['application/json'];

//-- Fetch Company Account --
export async function fetchCompanyAccount({
	id,
	search,
	status,
	type,
	limit,
	offset,
	location
}: {
	id?: string;
	search?: string;
	status?: number;
	type?: number;
	limit?: number;
	offset?: number;
	location?: string;
} = {}): Promise<FetchCompanyAccountResponse> {
	const params = new URLSearchParams();
	if (id) params.append('id', id);
	if (search) params.append('search', search);
	if (status !== undefined) params.append('status_list', String(status));
	if (type !== undefined) params.append('type_list', String(type));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));
	if (location) params.append('location', location);
	const query = params.toString();
	const url = `/entebus/account${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchCompanyAccountResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
