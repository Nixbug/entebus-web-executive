import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchCompanyAccountResponse =
	operations['fetch_company_executive_company_get']['responses'][200]['content']['application/json'];

//-- Fetch Company Account --
export async function fetchCompanyAccount({
	search,
	status,
	limit,
	offset,
	location
}: {
	search?: string;
	status?: number;
	limit?: number;
	offset?: number;
	location?: string;
} = {}): Promise<FetchCompanyAccountResponse> {
	const params = new URLSearchParams();
	if (search) params.append('search', search);
	if (status !== undefined) params.append('status_list', String(status));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));
	if (location) params.append('location', location);
	const query = params.toString();
	const url = `/entebus/account${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchCompanyAccountResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
