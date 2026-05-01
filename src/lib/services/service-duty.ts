import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchDutyListResponse =
	operations['fetch_duty_executive_company_service_duty_get']['responses'][200]['content']['application/json'];
export type UpdateDutyRequestBody =
	operations['update_duty_executive_company_service_duty__id__patch']['requestBody']['content']['application/json'];
export type UpdateDutyResponse =
	operations['update_duty_executive_company_service_duty__id__patch']['responses'][200]['content']['application/json'];
//-- Fetch all duties for a service --
export async function fetchDutyList({
	id,
	service_id,
	status,
	limit,
	company_id,
	offset
}: {
	id?: number;
	service_id?: number;
	status?: number;
	company_id?: number;
	limit?: number;
	offset?: number;
} = {}): Promise<FetchDutyListResponse> {
	const params = new URLSearchParams();
	if (id !== undefined) params.append('id', String(id));
	if (service_id !== undefined) params.append('service_id', String(service_id));
	if (status !== undefined) params.append('status_list', String(status));
	if (company_id !== undefined) params.append('company_id', String(company_id));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/company/service/duty${query ? `?${query}` : ''}`;
	const res = await apiFetch<FetchDutyListResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}

//-- Update a duty by its ID --
export async function updateDuty(
	id: number,
	payload: UpdateDutyRequestBody
): Promise<UpdateDutyResponse> {
	const url = `/company/service/duty/${encodeURIComponent(String(id))}`;
	const res = await apiFetch<UpdateDutyResponse>('PATCH', url, {
		body: payload,
		contentType: 'json'
	});
	if (!res.ok) throw res;
	return res.data as UpdateDutyResponse;
}
