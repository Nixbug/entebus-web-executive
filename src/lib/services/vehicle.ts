import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchVehicleListResponse =
	operations['fetch_vehicle_executive_company_vehicle_get']['responses'][200]['content']['application/json'];

//-- Fetch Vehicle List --
export async function fetchVehicleList({
	search,
	status,
	limit,
	company_id,
	offset
}: {
	search?: string;
	status?: number;
	company_id?: number;
	limit?: number;
	offset?: number;
} = {}): Promise<FetchVehicleListResponse> {
	const params = new URLSearchParams();
	if (search) params.append('search', search);
	if (status !== undefined) params.append('status_list', String(status));
	if (company_id !== undefined) params.append('company_id', String(company_id));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/company/vehicle${query ? `?${query}` : ''}`;

	const res = await apiFetch<FetchVehicleListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
