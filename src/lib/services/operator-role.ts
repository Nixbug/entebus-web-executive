import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchOperatorRoleListResponse =
	operations['fetch_role_executive_company_role_get']['responses'][200]['content']['application/json'];

export type OperatorRole = FetchOperatorRoleListResponse[number];

export type CreateOperatorRoleRequest =
	operations['create_role_executive_company_role_post']['requestBody']['content']['application/json'];

export type CreateOperatorRoleResponse =
	operations['create_role_executive_company_role_post']['responses'][201]['content']['application/json'];
export type UpdateRoleRequest =
	operations['update_role_executive_company_role__id__patch']['requestBody']['content']['application/json'];

export type UpdateRoleResponse =
	operations['update_role_executive_company_role__id__patch']['responses'][200]['content']['application/json'];

//-- Fetch operator role --
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

//-- Fetches a role by its ID. Throws on non-OK responses; returns null if not found. --
export async function fetchOperatorRoleById(id: number): Promise<OperatorRole | null> {
	const params = new URLSearchParams();
	params.append('id', String(id));
	const query = params.toString();
	const url = `/company/role${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchOperatorRoleListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data?.[0] ?? null;
}

//-- Creates operator role --
export async function createOperatorRole(
	payload: CreateOperatorRoleRequest
): Promise<CreateOperatorRoleResponse> {
	const url = `/company/role`;
	const res = await apiFetch<CreateOperatorRoleResponse>('POST', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as CreateOperatorRoleResponse;
}

//-- Updates operator role by ID --
export async function updateOperatorRole(
	id: number,
	payload: UpdateRoleRequest
): Promise<UpdateRoleResponse> {
	const url = `/company/role/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<UpdateRoleResponse>('PATCH', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as UpdateRoleResponse;
}

//-- Deletes operator role by ID --
export async function deleteOperatorRole(id: number): Promise<void> {
	const url = `/company/role/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<void>('DELETE', url);
	if (!res.ok) throw res;
}
