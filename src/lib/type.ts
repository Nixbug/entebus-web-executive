
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
export 	type Executive = {
		id: string;
		initials: string;
		name: string;
		designation: string;
        status?: string;
		gender: string;
		color: string;
		isYou?: boolean;
		email: string;
		phone: string;
		createdAt: string;
		[key: string]: any;
	};
	
export type ExecutiveRole={
    id: string;
    name: string;
    createdAt: string;
}