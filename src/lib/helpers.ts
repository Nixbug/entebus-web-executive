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

	return data.filter(item => {
		//-- text search --
		const matchesSearch =
			!hasSearch ||
			searchKeys.some(key => {
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
	return [...defaultCols.map(c => c.key), ...initiallySelectedOptional];
}


//-- Convert ISO UTC date string to IST formatted string --
export function utcToItcFormat(
	isoUtc: string | null | undefined,
	includeSeconds = true,
	showTZ = true
): string {
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

	if (includeSeconds) {
		//-- Some environments support 'second' in Intl options --
		//-- Add it defensively; if not supported, it will be ignored. --
		(options as any).second = '2-digit';
	}

	//-- Use en-US so month appears first as "Jan 14, 2026" --
	const formatted = new Intl.DateTimeFormat('en-US', options).format(d);

	return showTZ ? `${formatted}` : formatted;
}
