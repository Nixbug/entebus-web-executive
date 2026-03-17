import { apiFetch } from '$lib/services/fetch-client';
import type { components } from '$lib/api/types';

type Role = components['schemas']['ExecutiveRoleSchema'];

export async function fetchRoleById(id: number): Promise<Role | null> {
	const res = await apiFetch<Role[]>('GET', `/entebus/role?id=${id}`);
	if (!res.ok) throw res;
	return res.data?.[0] ?? null;
}
