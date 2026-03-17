import { apiFetch } from '$lib/services/fetch-client';
import type { components } from '$lib/api/types';

type RoleMap = components['schemas']['ExecutiveRoleMapSchema'];

export async function fetchRoleMap(executiveId: number): Promise<RoleMap[]> {
	const res = await apiFetch<RoleMap[]>('GET', `/entebus/account/role?executive_id=${executiveId}`);
	if (!res.ok) throw res;
	return res.data ?? [];
}
