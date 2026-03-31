import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchRoleListResponse =
	operations['fetch_role_entebus_role_get']['responses'][200]['content']['application/json'];

export type Role = FetchRoleListResponse[number];

export type CreateRoleRequest =
	operations['create_role_entebus_role_post']['requestBody']['content']['application/json'];

export type CreateRoleResponse =
	operations['create_role_entebus_role_post']['responses'][201]['content']['application/json'];

//-- Fetches a role by its ID. Throws on non-OK responses; returns null if not found. --
export async function fetchRoleById(id: number): Promise<Role | null> {
	const params = new URLSearchParams();
	params.append('id', String(id));
	const query = params.toString();
	const url = `/entebus/role${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchRoleListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data?.[0] ?? null;
}

//-- Fetch role list with common search params --
export async function fetchRoleList({
	name,
	id,
	search,
	limit,
	offset
}: {
	name?: string;
	id?: number;
	search?: string;
	limit?: number;
	offset?: number;
} = {}): Promise<Role[]> {
	const params = new URLSearchParams();
	if (name) params.append('name', name);
	if (search) params.append('search', search);
	if (id !== undefined) params.append('id', String(id));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/entebus/role${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchRoleListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}

//-- Deletes executive role by ID --
export async function deleteRole(id: number): Promise<void> {
	const url = `/entebus/role/${encodeURIComponent(String(id))}`;
	const res = await apiFetch('DELETE', url);
	if (!res.ok) throw res;
}

//-- Creates executive role --
export async function createRole(payload: CreateRoleRequest): Promise<CreateRoleResponse> {
	const url = `/entebus/role`;
	const res = await apiFetch<CreateRoleResponse>('POST', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as CreateRoleResponse;
}
