import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchExecutiveAccountResponse =
	operations['fetch_account_entebus_account_get']['responses'][200]['content']['application/json'];
export type DeleteExecutiveAccountResponse = null;
export type CreateExecutiveAccountResponse =
	operations['create_account_entebus_account_post']['responses'][201]['content']['application/json'];
export type CreateExecutiveAccountRequest =
	operations['create_account_entebus_account_post']['requestBody']['content']['application/json'];

export type UpdateExecutiveAccountRequest =
	operations['update_account_entebus_account__id__patch']['requestBody']['content']['application/json'];
export type UpdateExecutiveAccountResponse =
	operations['update_account_entebus_account__id__patch']['responses'][200]['content']['application/json'];

//-- Fetch Executive Account --
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

//-- Create Executive Account --
export async function createExecutiveAccount(
	payload: CreateExecutiveAccountRequest
): Promise<CreateExecutiveAccountResponse> {
	const url = `/entebus/account`;
	const res = await apiFetch<CreateExecutiveAccountResponse>('POST', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as CreateExecutiveAccountResponse;
}

//-- Update Executive Account --
export async function updateExecutiveAccount(
	id: number,
	payload: UpdateExecutiveAccountRequest
): Promise<UpdateExecutiveAccountResponse> {
	const url = `/entebus/account/${id}`;
	const res = await apiFetch<UpdateExecutiveAccountResponse>('PATCH', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as UpdateExecutiveAccountResponse;
}

//-- Delete Executive Account --
export async function deleteExecutiveAccount(id: number): Promise<DeleteExecutiveAccountResponse> {
	const url = `/entebus/account/${id}`;
	const res = await apiFetch<DeleteExecutiveAccountResponse>('DELETE', url);
	if (!res.ok) throw res;
	return res.data ?? null;
}
