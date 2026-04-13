import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchOperatorRoleMapResponse =
	operations['fetch_role_map_executive_company_account_role_get']['responses'][200]['content']['application/json'];
export type RoleMap = FetchOperatorRoleMapResponse[number];
export async function fetchOperatorRoleMap(operatorId?: number): Promise<RoleMap[]> {
	const params = new URLSearchParams();
	if (operatorId !== undefined) params.append('operator_id', String(operatorId));
	const query = params.toString();
	const url = `/entebus/account/role${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchOperatorRoleMapResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
