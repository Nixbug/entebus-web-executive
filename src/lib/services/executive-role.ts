import { apiFetch } from '$lib/services/fetch-client';
import type { components } from '$lib/api/types';

//-- Role type from API schema --
type Role = components['schemas']['ExecutiveRoleSchema'];

//-- Fetches a role by its ID. Returns null if not found. --
export async function fetchRoleById(id: number): Promise<Role | null> {
	const res = await apiFetch<Role[]>('GET', `/entebus/role?id=${id}`);
	if (!res.ok) throw res;
	return res.data?.[0] ?? null;
}
