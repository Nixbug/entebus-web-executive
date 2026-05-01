import {
	GENDER_LABEL_BY_VALUE,
	LANDMARK_TYPE_LABEL_BY_VALUE,
	OPERATOR_TYPE_LABEL_BY_VALUE,
	SERVICE_TICKET_MODE_LABEL_BY_VALUE,
	SERVICE_STATUS_LABEL_BY_VALUE,
	STATUS_LABEL_BY_VALUE,
	VEHICLE_STATUS_LABEL_BY_VALUE,
	DUTY_STATUS_LABEL_BY_VALUE
} from '$lib/constants';
import { Store } from './stores/session-store';
//-- filtering and searching for listing tables --
export interface FilterConfig {
	searchKeys?: string[];
	filters?: Record<string, string>;
}

export function applySearchAndFilters<T extends Record<string, any>>(
	data: T[],
	searchTerm: string,
	config: FilterConfig
): T[] {
	const { searchKeys = [], filters = {} } = config;

	const lowerSearchTerm = searchTerm ? searchTerm.trim().toLowerCase() : '';
	const hasSearch = lowerSearchTerm.length > 0;

	return data.filter((item) => {
		//-- text search --
		const matchesSearch =
			!hasSearch ||
			searchKeys.some((key) => {
				const value = item[key];
				if (value == null) return false;
				const valStr =
					typeof value === 'string' ? value.toLowerCase() : String(value).toLowerCase();
				return valStr.includes(lowerSearchTerm);
			});

		//-- field-based filters --
		const matchesFilters = Object.entries(filters).every(([key, val]) => {
			if (!val || val.toLowerCase().startsWith('all')) return true;
			return item[key] === val;
		});

		return matchesSearch && matchesFilters;
	});
}

//-- column visibility for listing tables --
export function getInitialVisibleColumns(
	defaultCols: { key: string }[],
	optionalCols: { key: string }[],
	initiallySelectedOptional: string[] = []
) {
	return [...defaultCols.map((c) => c.key), ...initiallySelectedOptional];
}

//-- Convert ISO UTC date string to IST formatted string --
export function utcToIstFormat(isoUtc: string | null | undefined, showTZ = true): string {
	if (!isoUtc) return '';
	const d = new Date(isoUtc);
	if (isNaN(d.getTime())) return String(isoUtc);

	const options: Intl.DateTimeFormatOptions = {
		timeZone: 'Asia/Kolkata',
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	};

	//-- Use en-US so month appears first as "Jan 14, 2026" --
	const formatted = new Intl.DateTimeFormat('en-US', options).format(d);

	return showTZ ? `${formatted}` : formatted;
}
/**
 * Convert a UTC time or datetime string to IST time-only string.
 * Accepts full ISO datetimes (e.g. 2026-04-18T04:03:36Z) or time-only values
 * (e.g. 04:03:15.448000Z). Returns a localized time string like "09:33:15 AM".
 */
export function utcToIstTime(isoUtc: string | null | undefined, includeSeconds = false): string {
	if (!isoUtc) return '';
	const s = String(isoUtc);
	let input = s;
	const timeOnlyMatch = /^\d{1,2}[:.]\d{2}(:\d{2}(?:\.\d+)?)?Z$/i;
	if (timeOnlyMatch.test(input)) {
		input = `1970-01-01T${input}`;
	}
	const d = new Date(input);
	if (isNaN(d.getTime())) return s;

	const options: Intl.DateTimeFormatOptions = {
		timeZone: 'Asia/Kolkata',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	};
	if (includeSeconds) (options as any).second = '2-digit';

	return new Intl.DateTimeFormat('en-US', options).format(d);
}

//-- Format distance for display --
export function formatDistance(meters: number): string {
	if (meters >= 1000) {
		return `${(meters / 1000).toFixed(1)} km`;
	}
	return `${meters} m`;
}

//-- Parse route starting time and compute actual arrival/departure times --
export function parseStartingTime(timeStr: string): number {
	//-- Match HH:MM or HH:MM:SS followed by AM/PM, ignoring seconds if present --
	const match = timeStr.match(/(\d{1,2})[:.](\d{2})(?:[:.]?\d+)?\s*(AM|PM)/i);
	if (!match) return 0;
	let hours = parseInt(match[1]);
	const minutes = parseInt(match[2]);
	const period = match[3].toUpperCase();
	if (period === 'PM' && hours !== 12) hours += 12;
	if (period === 'AM' && hours === 12) hours = 0;
	return hours * 60 + minutes;
}

//-- Map backend gender/status values to display labels --
export function mapGenderToLabel(value: number | null | undefined): string {
	if (value == null) return '';
	return GENDER_LABEL_BY_VALUE[value as import('$lib/constants').GenderEnum] ?? '';
}

export function mapStatusToLabel(value: number | null | undefined): string {
	if (value == null) return '';
	return STATUS_LABEL_BY_VALUE[value as import('$lib/constants').StatusEnum] ?? '';
}

export function mapOperatorTypeToLabel(value: number | null | undefined): string {
	if (value == null) return '';
	return OPERATOR_TYPE_LABEL_BY_VALUE[value as import('$lib/constants').OperatorTypeEnum] ?? '';
}

//-- Convert a string (or unknown) to title case: "john DOE" -> "John Doe"
export function titleCase(v: unknown): string {
	if (!v && v !== 0) return '';
	const s = String(v);
	return s
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : ''))
		.join(' ');
}

//-- Compute initials: prefer provided `initials`, otherwise derive from `name`, otherwise `fallback` --
export function getInitials(
	initials?: string | null,
	name?: string | null,
	fallback = 'JD'
): string {
	const i = initials && String(initials).trim();
	if (i) return i;
	const n = name && String(name).trim();
	if (!n) return fallback;
	const parts = n.split(/\s+/).filter(Boolean);
	if (parts.length === 0) return fallback;
	if (parts.length === 1) {
		return parts[0][0].toUpperCase();
	}
	const firstInitial = parts[0][0];
	const lastInitial = parts[parts.length - 1][0];
	return `${firstInitial}${lastInitial}`.toUpperCase();
}

//-- get logged in user ID --
export function getLoggedInUserId(): number | null {
	const storeToken = Store.fetchData('token');
	const raw =
		(storeToken && typeof storeToken === 'object' && Object.keys(storeToken).length > 0
			? storeToken
			: null) ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

	if (!raw) return null;

	const token =
		typeof raw === 'string'
			? (() => {
					try {
						return JSON.parse(raw);
					} catch {
						return null;
					}
				})()
			: raw;

	if (!token) return null;

	const id = token.executive_id ?? token.executiveId ?? token.id;
	if (typeof id === 'number') return id;
	if (typeof id === 'string' && /^\d+$/.test(id)) return Number(id);
	return null;
}

//-- Map backend landmark type values to display labels --
export function mapLandmarkTypeToLabel(value: number | null | undefined): string {
	if (value == null) return '';
	return LANDMARK_TYPE_LABEL_BY_VALUE[value as import('$lib/constants').LandmarkTypeEnum] ?? '';
}

//-- Map backend vehicle status values to display labels --
export function mapVehicleStatusToLabel(value: number | null | undefined): string {
	if (value == null) return '';
	return VEHICLE_STATUS_LABEL_BY_VALUE[value as import('$lib/constants').VehicleStatusEnum] ?? '';
}

//--map backend service ticket mode values to display labels --
export function mapServiceTicketModeToLabel(value: number | null | undefined): string {
	if (value == null) return '';
	return (
		SERVICE_TICKET_MODE_LABEL_BY_VALUE[value as import('$lib/constants').ServiceTicketModeEnum] ??
		''
	);
}

//-- Map backend service status values to display labels --
export function mapServiceStatusToLabel(value: number | null | undefined): string {
	if (value == null) return '';
	return SERVICE_STATUS_LABEL_BY_VALUE[value as import('$lib/constants').ServiceStatusEnum] ?? '';
}

//-- Map backend duty status values to display labels --
export function mapDutyStatusToLabel(value: number | null | undefined): string {
	if (value == null) return '';
	return DUTY_STATUS_LABEL_BY_VALUE[value as import('$lib/constants').DutyStatusEnum] ?? '';
}
