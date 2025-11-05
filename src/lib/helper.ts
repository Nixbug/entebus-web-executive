import type { ColumnConfig, FilterType } from './type';

//-- Table Helper Functions --//
export function getLabel<T extends Record<string, any>>(
    col: keyof T,
    columnConfigs: ColumnConfig<keyof T>[]
): string {
    const cfg = columnConfigs.find((c) => c.key === col);
    return cfg?.label ?? String(col);
}

export function getFilter<T extends Record<string, any>>(
    col: keyof T,
    columnConfigs: ColumnConfig<keyof T>[]
): FilterType {
    const cfg = columnConfigs.find((c) => c.key === col);
    return cfg?.filterType ?? 'text';
}

export function getSelectOptions<T extends Record<string, any>>(
    col: keyof T,
    columnConfigs: ColumnConfig<keyof T>[]
): string[] {
    const f = getFilter(col, columnConfigs);
    return typeof f === 'object' && f.type === 'select' ? f.options : [];
}

export function getSelectDefault<T extends Record<string, any>>(
    col: keyof T,
    columnConfigs: ColumnConfig<keyof T>[]
): string {
    const f = getFilter(col, columnConfigs);
    if (typeof f === 'object' && f.type === 'select') {
        return f.default ?? f.options[0] ?? 'All';
    }
    return 'All';
}

export function getConfig<T extends Record<string, any>>(
    col: keyof T,
    columnConfigs: ColumnConfig<keyof T>[]
): ColumnConfig<keyof T> | undefined {
    return columnConfigs.find((c) => c.key === col);
}

export function getWidth<T extends Record<string, any>>(
    col: keyof T,
    columnConfigs: ColumnConfig<keyof T>[],
    fallback: string = 'auto'
): string {
    const cfg = getConfig(col, columnConfigs);
    return cfg?.width ?? fallback;
}
export function getMinWidth<T extends Record<string, any>>(
    col: keyof T,
    columnConfigs: ColumnConfig<keyof T>[],
    fallback: string = '70px'
): string {
    const cfg = getConfig(col, columnConfigs);
    return cfg?.minWidth ?? cfg?.width ?? fallback;
}

//-- sesssion storage --//
export class Store {
	static storeData<T>(key: string, objAsStr: string) {
		sessionStorage.setItem(key, objAsStr);
	}

	static fetchData<T>(key: string) {
		let objectAsString = sessionStorage.getItem(key);
		if (objectAsString) {
			return JSON.parse(objectAsString) as T;
		}
		return {} as T;
	}
    static clearData(key: string) {
        sessionStorage.removeItem(key);
    }
}