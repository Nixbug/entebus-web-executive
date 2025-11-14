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

	return data.filter(item => {
		//-- text search --
		const matchesSearch =
			!searchTerm ||
			searchKeys.some(key => {
				const value = item[key];
				return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
			});

		//-- field-based filters --
		const matchesFilters = Object.entries(filters).every(([key, val]) => {
			if (!val || val.startsWith('All')) return true; // skip “All …” values
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
export function filterVisibleColumns<T>(
	data: T[],
	visibleKeys: string[]
): (keyof T)[] {
	return visibleKeys as (keyof T)[];
}
