import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchRoleMapResponse =
	operations['fetch_role_map_entebus_account_role_get']['responses'][200]['content']['application/json'];

export type RoleMap = FetchRoleMapResponse[number];

//-- Fetches the role map for a given executive ID. --
export async function fetchRoleMap(executiveId?: number): Promise<RoleMap[]> {
	const params = new URLSearchParams();
	if (executiveId !== undefined) params.append('executive_id', String(executiveId));
	const query = params.toString();
	const url = `/entebus/account/role${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchRoleMapResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
