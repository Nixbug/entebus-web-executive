import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchOperatorRoleMapResponse =
	operations['fetch_role_map_executive_company_account_role_get']['responses'][200]['content']['application/json'];
export type RoleMap = FetchOperatorRoleMapResponse[number];

export type CreateOperatorRoleMapRequest =
	operations['create_role_map_executive_company_account_role_post']['requestBody']['content']['application/json'];

export type CreateOperatorRoleMapResponse =
	operations['create_role_map_executive_company_account_role_post']['responses'][201]['content']['application/json'];

export type UpdateOperatorRoleMapRequest =
	operations['update_role_map_executive_company_account_role__id__patch']['requestBody']['content']['application/json'];

export type UpdateOperatorRoleMapResponse =
	operations['update_role_map_executive_company_account_role__id__patch']['responses'][200]['content']['application/json'];

export async function fetchOperatorRoleMap(operatorId?: number): Promise<RoleMap[]> {
	const params = new URLSearchParams();
	if (operatorId !== undefined) params.append('operator_id', String(operatorId));
	const query = params.toString();
	const url = `/company/account/role${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchOperatorRoleMapResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}

//-- Creates a new role mapping (assign role to operator) --
export async function createRoleMap(
	payload: CreateOperatorRoleMapRequest
): Promise<CreateOperatorRoleMapResponse> {
	const url = `/company/account/role`;
	const res = await apiFetch<CreateOperatorRoleMapResponse>('POST', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as CreateOperatorRoleMapResponse;
}
//-- Updates an existing role mapping (change role for operator) --
export async function updateOperatorRoleMap(
	id: number,
	payload: UpdateOperatorRoleMapRequest
): Promise<UpdateOperatorRoleMapResponse> {
	const url = `/company/account/role/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<UpdateOperatorRoleMapResponse>('PATCH', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as UpdateOperatorRoleMapResponse;
}

//-- Deletes a role mapping (unassign role from operator) --
export async function deleteOperatorRoleMap(id: number): Promise<void> {
	const url = `/company/account/role/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<void>('DELETE', url);
	if (!res.ok) throw res;
}
