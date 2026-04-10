import { browser } from '$app/environment';
import { Store } from '$lib/stores/session-store';

type Perms = Record<string, unknown>;

function getStoredPermissions(): Perms {
	//-- Prefer session-stored merged permissions (restored from localStorage on login) --
	try {
		const p = Store.fetchData<Perms>('permissions');
		if (p && Object.keys(p).length > 0) return p;
	} catch {}

	//-- Fallback to localStorage for persisted sessions --
	if (!browser) return {};
	try {
		const raw = localStorage.getItem('permissions');
		if (!raw) return {};
		return JSON.parse(raw) as Perms;
	} catch {
		return {};
	}
}

/**
 * Safely traverse permission object using dot-separated path
 * e.g. hasPermission('executive.delete') -> boolean
 */
export function hasPermission(path: string): boolean {
	if (!path) return false;
	const perms = getStoredPermissions();
	const parts = path.split('.').filter(Boolean);
	let cur: any = perms;
	for (const part of parts) {
		if (!cur || typeof cur !== 'object') return false;
		cur = cur[part];
	}
	return typeof cur === 'boolean' ? cur : false;
}

/** Specific convenience checks */

//-- executive.create permission check --
export function canCreateExecutiveAccount(): boolean {
	return hasPermission('executive.create');
}

//-- executive.update permission check --
export function canUpdateExecutiveAccount(): boolean {
	return hasPermission('executive.update');
}

//-- executive.delete permission check --
export function canDeleteExecutiveAccount(): boolean {
	return hasPermission('executive.delete');
}

//-- executive role create permission check --
export function canCreateExecutiveRole(): boolean {
	return hasPermission('executive.role.create');
}

//-- executive role update permission check --
export function canUpdateExecutiveRole(): boolean {
	return hasPermission('executive.role.update');
}
//-- executive role delete permission check --
export function canDeleteExecutiveRole(): boolean {
	return hasPermission('executive.role.delete');
}

//-- landmark permissions --
export function canCreateLandmark(): boolean {
	return hasPermission('landmark.create');
}

export function canDeleteLandmark(): boolean {
	return hasPermission('landmark.delete');
}

export function canUpdateLandmark(): boolean {
	return hasPermission('landmark.update');
}

//-- bus stop permissions --
export function canDeleteBusStop(): boolean {
	return hasPermission('landmark.bus_stop.delete');
}

//-- company permissions --
export function canCreateCompany(): boolean {
	return hasPermission('company.create');
}
