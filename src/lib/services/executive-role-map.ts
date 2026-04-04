import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchRoleMapResponse =
	operations['fetch_role_map_entebus_account_role_get']['responses'][200]['content']['application/json'];

export type RoleMap = FetchRoleMapResponse[number];
export type CreateRoleMapRequest =
	operations['create_role_map_entebus_account_role_post']['requestBody']['content']['application/json'];

export type CreateRoleMapResponse =
	operations['create_role_map_entebus_account_role_post']['responses'][201]['content']['application/json'];

export type UpdateRoleMapRequest =
	operations['update_role_map_entebus_account_role__id__patch']['requestBody']['content']['application/json'];

export type UpdateRoleMapResponse =
	operations['update_role_map_entebus_account_role__id__patch']['responses'][200]['content']['application/json'];
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

//-- Creates a new role mapping (assign role to executive) --
export async function createRoleMap(payload: CreateRoleMapRequest): Promise<CreateRoleMapResponse> {
	const url = `/entebus/account/role`;
	const res = await apiFetch<CreateRoleMapResponse>('POST', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as CreateRoleMapResponse;
}

//-- Updates an existing role mapping (change role for executive) --
export async function updateRoleMap(
	id: number,
	payload: UpdateRoleMapRequest
): Promise<UpdateRoleMapResponse> {
	const url = `/entebus/account/role/${id}`;
	const res = await apiFetch<UpdateRoleMapResponse>('PATCH', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as UpdateRoleMapResponse;
}

//-- Deletes a role mapping (unassign role from executive) --
export async function deleteRoleMap(id: number): Promise<void> {
	const url = `/entebus/account/role/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<void>('DELETE', url);
	if (!res.ok) throw res;
}