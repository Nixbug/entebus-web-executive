import { apiFetch } from '$lib/services/fetch-client';
import type { components } from '$lib/api/types';

//-- Executive account type from API schema --//
export type ExecutiveAccount = components['schemas']['ExecutiveSchema'];

export async function fetchExecutiveAccount({
	search,
	limit,
	offset
}: {
	search?: string;
	limit?: number;
	offset?: number;
} = {}): Promise<ExecutiveAccount[]> {
	const params = new URLSearchParams();
	if (search) params.append('search', search);
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/entebus/account${query ? `?${query}` : ''}`;

	const res = await apiFetch<ExecutiveAccount[]>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
