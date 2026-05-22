import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchPaperTicketResponse =
	operations['fetch_paper_ticket_executive_company_service_ticket_paper_get']['responses'][200]['content']['application/json'];

//-- Fetch all paper tickets for a service --
export async function fetchPaperTicketList({
	id,
	duty_id,
	status,
	limit,
	company_id,
	offset
}: {
	id?: number;
	duty_id?: number;
	status?: number;
	company_id?: number;
	limit?: number;
	offset?: number;
} = {}): Promise<FetchPaperTicketResponse> {
	const params = new URLSearchParams();
	if (id !== undefined) params.append('id', String(id));
	if (duty_id !== undefined) params.append('duty_id', String(duty_id));
	if (status !== undefined) params.append('status_list', String(status));
	if (company_id !== undefined) params.append('company_id', String(company_id));
	if (limit !== undefined) params.append('limit', String(limit));
	if (offset !== undefined) params.append('offset', String(offset));

	const query = params.toString();
	const url = `/company/service/ticket/paper${query ? `?${query}` : ''}`;
	const res = await apiFetch<FetchPaperTicketResponse>('GET', url);
	if (!res.ok) throw res;
	return res.data ?? [];
}
