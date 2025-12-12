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
			if (!val || val.startsWith('All')) return true;
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
