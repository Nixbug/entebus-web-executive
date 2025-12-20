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

export type ExecutiveRole = {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

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
