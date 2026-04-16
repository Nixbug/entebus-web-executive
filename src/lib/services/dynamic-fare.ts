import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

//-- FareSchema from API components (used as response type for GET) --
export type FareSchema =
	operations['fetch_fare_executive_company_fare_get']['responses'][200]['content']['application/json'];

export type FareCreateSchema =
	operations['create_fare_executive_company_fare_post']['requestBody']['content']['application/json'];
export type FareCreateResponseSchema =
	operations['create_fare_executive_company_fare_post']['responses'][201]['content']['application/json'];

export type UpdateExecutiveAccountRequest =
	operations['update_account_entebus_account__id__patch']['requestBody']['content']['application/json'];
export type UpdateExecutiveAccountResponse =
	operations['update_account_entebus_account__id__patch']['responses'][200]['content']['application/json'];

export type UpdateFareRequest =
	operations['update_fare_executive_company_fare__id__patch']['requestBody']['content']['application/json'];

export type UpdateFareResponse =
	operations['update_fare_executive_company_fare__id__patch']['responses'][200]['content']['application/json'];

//-- Fetch fare list with search, pagination, and scope filtering --
export async function fetchFareList({
	scope,
	search,
	limit,
	offset
}: {
	scope: number;
	search?: string;
	limit?: number;
	offset?: number;
}): Promise<FareSchema[]> {
	const params = new URLSearchParams();
	params.append('scope', String(scope));
	if (search) params.append('search', search);
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/company/fare${query ? `?${query}` : ''}`;

	const res = await apiFetch<FareSchema[]>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}

//-- Fetches a fare by its ID.--
export async function fetchFareById(id: number): Promise<FareSchema | null> {
	const params = new URLSearchParams();
	params.append('id', String(id));
	const query = params.toString();
	const url = `/company/fare${query ? `?${query}` : ''}`;

	const res = await apiFetch<FareSchema[]>('GET', url);
	if (!res.ok) throw res;
	return res.data?.[0] ?? null;
}

//-- Creates fare --
export async function createFare(payload: FareCreateSchema): Promise<FareCreateResponseSchema> {
	const url = `/company/fare`;
	const res = await apiFetch<FareCreateResponseSchema>('POST', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as FareCreateResponseSchema;
}

//-- Updates fare by ID --
export async function updateFare(
	id: number,
	payload: UpdateFareRequest
): Promise<UpdateFareResponse> {
	const url = `/company/fare/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<UpdateFareResponse>('PATCH', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as UpdateFareResponse;
}

//-- Deletes fare by ID --
export async function deleteFare(id: number): Promise<void> {
	const url = `/company/fare/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<void>('DELETE', url);
	if (!res.ok) throw res;
}
