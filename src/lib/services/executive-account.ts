import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchExecutiveAccountResponse =
	operations['fetch_account_entebus_account_get']['responses'][200]['content']['application/json'];

export async function fetchExecutiveAccount({
	search,
	gender,
	status,
	limit,
	offset
}: {
	search?: string;
	gender?: number;
	status?: number;
	limit?: number;
	offset?: number;
} = {}): Promise<FetchExecutiveAccountResponse> {
	const params = new URLSearchParams();
	if (search) params.append('search', search);
	if (gender !== undefined) params.append('gender', String(gender));
	if (status !== undefined) params.append('status_list', String(status));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/entebus/account${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchExecutiveAccountResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
