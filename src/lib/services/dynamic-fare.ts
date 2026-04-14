import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

//-- FareSchema from API components (used as response type for GET) --
export type FareSchema =
	operations['fetch_fare_executive_company_fare_get']['responses'][200]['content']['application/json'];

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
