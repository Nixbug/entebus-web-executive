import { apiFetch } from '$lib/services/fetch-client';
import type { components } from '$lib/api/types';

//-- FareSchema from API components (used as response type for GET) --
export type FareSchema = components['schemas']['FareSchema'];

//-- Scope enum: 1 = GLOBAL, 2 = LOCAL --
export const FARE_SCOPE = { GLOBAL: 1, LOCAL: 2 } as const;
export type FareScope = components['schemas']['FareScope'];

//-- Fetch fare list with search, pagination, and scope filtering --
export async function fetchFareList({
	scope,
	search,
	limit,
	offset
}: {
	scope: FareScope;
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

//-- Fetch a single fare by ID (uses list endpoint filtered by id).
//-- Accepts optional `scope` because IDs may not be globally unique across scopes.
export async function fetchFareById(id: number): Promise<FareSchema | null> {
	const params = new URLSearchParams();
	params.append('id', String(id));
	const query = params.toString();
	const url = `/company/fare${query ? `?${query}` : ''}`;

	const res = await apiFetch<FareSchema[]>('GET', url);
	if (!res.ok) throw res;
	return res.data?.[0] ?? null;
}
