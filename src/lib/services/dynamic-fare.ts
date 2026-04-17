import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

//-- FareSchema from API components (used as response type for GET) --
export type FareSchema =
	operations['fetch_fare_executive_company_fare_get']['responses'][200]['content']['application/json'];

export type FareCreateSchema =
	operations['create_fare_executive_company_fare_post']['requestBody']['content']['application/json'];
export type FareCreateResponseSchema =
	operations['create_fare_executive_company_fare_post']['responses'][201]['content']['application/json'];

//-- Fetch fare list with search, pagination, and scope filtering --
export async function fetchFareList({
	scope,
	search,
	company_id,
	limit,
	offset
}: {
	scope?: number;
	search?: string;
	company_id?: number;
	limit?: number;
	offset?: number;
}): Promise<FareSchema[]> {
	const params = new URLSearchParams();
	if (scope !== undefined) params.append('scope', String(scope));
	if (search) params.append('search', search);
	if (company_id !== undefined) params.append('company_id', String(company_id));
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
