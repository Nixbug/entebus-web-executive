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

//-- Landmark type definition --
export type Landmark = {
    id: string;
    name: string;
    boundary: string;
    type: string;
    createdAt?: string;
    updatedAt?: string;
};

//-- Bus Stop type definition --
export type BusStop = {
    id: string;
    name: string;
    location: string;
    landmarkId: string;
};

//-- GlobalFare type definition --
export type GlobalFare = {
    id: string;
    name: string;
    version: number;
    attributes: {
        df_version: number;
        ticket_types: Array<{ id: number; name: string }>;
        currency_type: string;
        distance_unit: string;
        extra: Record<string, any>;
    };
    function: string;
    created_on: string;
    updated_on: string;
};

//-- TileProvider type definition for generic map tile providers --
export interface TileProvider {
    /** Unique identifier / display name for the provider */
    name: string;
    /** Tile URL template with {x}, {y}, {z} placeholders. Empty string means use built-in OSM. */
    url: string;
    /** Optional attribution text to display on the map */
    attribution?: string;
    /** Maximum zoom level supported by this provider (default: 19) */
    maxZoom?: number;
    /** Whether this is a built-in provider (cannot be removed) */
    isBuiltIn?: boolean;
}