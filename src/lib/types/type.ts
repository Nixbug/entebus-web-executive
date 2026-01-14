//-- ExecutiveToken type definition --
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

//-- Executive type definition --
export type Executive = {
    id: string;
    initials: string;
    name: string;
    designation: string;
    gender: string;
    isYou?: boolean;
    email: string;
    phone: string;
    createdAt: string;
    [key: string]: any;
    isActive?: boolean;
    username: string;
    password: string;
};

//-- ExecutiveRole type definition --
export type ExecutiveRole = {
    id: string;
    name: string;
    permissions: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

//-- Company type definition --
export type Company = {
    id: string;
    ownerName: string;
    name: string;
    address: string;
    location: string;
    email: string;
    phone: string;
    status: string;
    type: string;
    createdAt: string;
    updatedAt: string;
};

//-- GlobalFare type definition --
export type GlobalFare = {
    id: number;
    name: string;
    attributes: {
        df_version: number;
        ticket_types: Array<{ id: number; name: string }>;
        currency_type: string;
        distance_unit: string;
        extra: Record<string, any>;
    };
    created_on: string;
    updated_on: string;
};