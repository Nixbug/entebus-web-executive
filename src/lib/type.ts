export type FilterType =
    | 'text'
    | { type: 'select'; options: string[]; default?: string };

export interface ColumnConfig<T extends string | number | symbol = string> {
    key: T;
    label: string;
    alwaysVisible?: boolean;
    filterType?: FilterType;
    width?: string;
    minWidth?: string;
}

export interface Executive {
    id: number;
    name: string;
    phone: string;
    gender: string;
    email?: string;
    designation?: string;
    status?: string;
}

export interface ExecutiveToken {
    id: number;
    executiveId: number;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshBefore: string;
    platformType: number;
    tokenType: string;
    createdOn: string;
    updatedOn?: string | null;
    clientDetails?: string | null;
}
