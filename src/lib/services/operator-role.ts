import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchOperatorRoleListResponse =
	operations['fetch_role_executive_company_role_get']['responses'][200]['content']['application/json'];

export type OperatorRole = FetchOperatorRoleListResponse[number];
export async function fetchOperatorRoleList({
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
} = {}): Promise<OperatorRole[]> {
	const params = new URLSearchParams();
	if (name) params.append('name', name);
	if (search) params.append('search', search);
	if (company_id !== undefined) params.append('company_id', String(company_id));
	if (id !== undefined) params.append('id', String(id));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/company/role${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchOperatorRoleListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
