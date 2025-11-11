export interface FilterConfig {
	searchKeys?: string[]; // keys to search text in
	filters?: Record<string, string>; // active filter values
}

export function applySearchAndFilters<T extends Record<string, any>>(
	data: T[],
	searchTerm: string,
	config: FilterConfig
): T[] {
	const { searchKeys = [], filters = {} } = config;

	return data.filter(item => {
		// --- text search
		const matchesSearch =
			!searchTerm ||
			searchKeys.some(key => {
				const value = item[key];
				return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
			});

		// --- field-based filters
		const matchesFilters = Object.entries(filters).every(([key, val]) => {
			if (!val || val.startsWith('All')) return true; // skip “All …” values
			return item[key] === val;
		});

		return matchesSearch && matchesFilters;
	});
}



export function getInitialVisibleColumns(
	defaultCols: { key: string }[],
	optionalCols: { key: string }[]
) {
	return [...defaultCols.map(c => c.key), ...optionalCols.map(c => c.key)];
}

export function filterVisibleColumns<T>(
	data: T[],
	visibleKeys: string[]
): (keyof T)[] {
	return visibleKeys as (keyof T)[];
}
