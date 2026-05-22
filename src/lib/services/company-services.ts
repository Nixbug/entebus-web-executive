import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchServiceListResponse =
	operations['fetch_service_executive_company_service_get']['responses'][200]['content']['application/json'];
export type FetchServiceDetailResponse =
	operations['fetch_service_details_for_executive_company_service__id__get']['responses'][200]['content']['application/json'];

export type CreateServiceRequest =
	operations['create_service_executive_company_service_post']['requestBody']['content']['application/json'];
export type CreateServiceResponse =
	operations['create_service_executive_company_service_post']['responses'][201]['content']['application/json'];
export type UpdateServiceRequest =
	operations['update_service_executive_company_service__id__patch']['requestBody']['content']['application/json'];
export type UpdateServiceResponse =
	operations['update_service_executive_company_service__id__patch']['responses'][200]['content']['application/json'];
export type DeleteServiceResponse = null;
//-- Fetch all services --
export async function fetchServiceList({
	search,
	id,
	status,
	ticket_mode,
	limit,
	company_id,
	offset,
	id_list,
	starting_at_ge,
	starting_at_le,
	order_by,
	order_in
}: {
	search?: string;
	id?: number;
	status?: number;
	ticket_mode?: number;
	company_id?: number;
	limit?: number;
	offset?: number;
	id_list?: number[];
	starting_at_ge?: string;
	starting_at_le?: string;
	order_by?: string;
	order_in?: string;
} = {}): Promise<FetchServiceListResponse> {
	const params = new URLSearchParams();
	if (search) params.append('search', search);
	if (id !== undefined) params.append('id', String(id));
	if (status !== undefined) params.append('status_list', String(status));
	if (ticket_mode !== undefined) params.append('ticket_mode', String(ticket_mode));
	if (company_id !== undefined) params.append('company_id', String(company_id));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));
	if (id_list !== undefined) for (const id of id_list) params.append('id_list', String(id));
	if (starting_at_ge !== undefined) params.append('starting_at_ge', starting_at_ge);
	if (starting_at_le !== undefined) params.append('starting_at_le', starting_at_le);
	if (order_by !== undefined) params.append('order_by', order_by);
	if (order_in !== undefined) params.append('order_in', order_in);

	const query = params.toString();
	const url = `/company/service${query ? `?${query}` : ''}`;
	const res = await apiFetch<FetchServiceListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}

//-- Fetch service details --
export async function fetchServiceDetail(id: number): Promise<FetchServiceDetailResponse> {
	const url = `/company/service/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<FetchServiceDetailResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data!;
}

//-- Create a new service --
export async function createService(payload: CreateServiceRequest): Promise<CreateServiceResponse> {
	const url = `/company/service`;
	const res = await apiFetch<CreateServiceResponse>('POST', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as CreateServiceResponse;
}

//-- Update service --
export async function updateService(
	id: number,
	payload: UpdateServiceRequest
): Promise<UpdateServiceResponse> {
	const url = `/company/service/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<UpdateServiceResponse>('PATCH', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as UpdateServiceResponse;
}

//-- Delete Service --
export async function deleteService(id: number): Promise<DeleteServiceResponse> {
	const url = `/company/service/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<DeleteServiceResponse>('DELETE', url);
	if (!res.ok) throw res;
	return res.data ?? null;
}
