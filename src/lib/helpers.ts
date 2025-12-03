//-- filtering and searching for listing tables --
export interface FilterConfig {
	searchKeys?: string[];
	filters?: Record<string, string>;
}
export function normalizeFilters(filters: Record<string, string>) {
	return Object.fromEntries(
		Object.entries(filters).map(([key, val]) => {
			//-- Convert UI "All …" values into a sentinel empty string --
			if (!val || val.startsWith("All")) return [key, ""];
			return [key, val];
		})
	);
}

export function applySearchAndFilters<T extends Record<string, any>>(
	data: T[],
	searchTerm: string,
	config: FilterConfig
): T[] {
	const { searchKeys = [], filters = {} } = config;

	return data.filter(item => {
		const matchesSearch =
			!searchTerm ||
			searchKeys.some(key => {
				const value = item[key];
				return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
			});

		const matchesFilters = Object.entries(filters).every(([key, val]) => {
			if (!val) return true; // "" = no filter
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
