import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchServiceAssignmentListResponse =
	operations['fetch_assignment_executive_company_service_assignment_get']['responses'][200]['content']['application/json'];

export type CreateServiceAssignmentRequest =
	operations['create_assignment_executive_company_service_assignment_post']['requestBody']['content']['application/json'];
export type CreateServiceAssignmentResponse =
	operations['create_assignment_executive_company_service_assignment_post']['responses'][201]['content']['application/json'];

//-- Fetch all service assignments --
export async function fetchServiceAssignmentList({
	id,
	operator_id,
	service_id,
	limit,
	company_id,
	offset
}: {
	search?: string;
	id?: number;
	operator_id?: number;
	service_id?: number;
	limit?: number;
	company_id?: number;
	offset?: number;
} = {}): Promise<FetchServiceAssignmentListResponse> {
	const params = new URLSearchParams();
	if (id !== undefined) params.append('id', String(id));
	if (operator_id !== undefined) params.append('operator_id', String(operator_id));
	if (service_id !== undefined) params.append('service_id', String(service_id));
	if (company_id !== undefined) params.append('company_id', String(company_id));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/company/service/assignment${query ? `?${query}` : ''}`;
	const res = await apiFetch<FetchServiceAssignmentListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}

//-- Create a new service assignment --
export async function createServiceAssignment(
	payload: CreateServiceAssignmentRequest
): Promise<CreateServiceAssignmentResponse> {
	const url = `/company/service/assignment`;
	const res = await apiFetch<CreateServiceAssignmentResponse>('POST', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as CreateServiceAssignmentResponse;
}

//-- Delete a service assignment by ID --
export async function deleteServiceAssignment(id: number): Promise<void> {
	const url = `/company/service/assignment/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<void>('DELETE', url);
	if (!res.ok) throw res;
}
