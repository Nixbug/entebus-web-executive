import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchOperatorAccountResponse =
	operations['fetch_account_executive_company_account_get']['responses'][200]['content']['application/json'];

//-- Fetch Operator Account --
export async function fetchOperatorAccount({
	search,
	gender,
	status,
	type,
	limit,
	company_id,
	offset
}: {
	search?: string;
	gender?: number;
	status?: number;
	type?: number;
	company_id?: number;
	limit?: number;
	offset?: number;
} = {}): Promise<FetchOperatorAccountResponse> {
	const params = new URLSearchParams();
	if (search) params.append('search', search);
	if (gender !== undefined) params.append('gender', String(gender));
	if (status !== undefined) params.append('status_list', String(status));
	if (type !== undefined) params.append('type_list', String(type));
	if (company_id !== undefined) params.append('company_id', String(company_id));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/company/account${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchOperatorAccountResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
