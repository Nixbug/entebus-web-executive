import { apiFetch } from '$lib/services/fetch-client';
import type { components } from '$lib/api/types';

//-- Executive account type from API schema --//
export type ExecutiveAccount = components['schemas']['ExecutiveSchema'];

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
} = {}): Promise<ExecutiveAccount[]> {
	const params = new URLSearchParams();
	if (search) params.append('search', search);
	if (gender !== undefined) params.append('gender', String(gender));
	if (status !== undefined) params.append('status', String(status));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/entebus/account${query ? `?${query}` : ''}`;

	const res = await apiFetch<ExecutiveAccount[]>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
