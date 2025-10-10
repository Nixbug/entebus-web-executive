export interface Activity {
    is_disabled: boolean
    in_progress: boolean;
    error_message: string;
}

export interface LoginForm {
    username: string;
    password: string;
}

export interface MaskedExecutiveToken {
    id: number;
    executive_id: number;
    last_used?: string;
    created_on: string;
    expires_in: number;
    platform_type?: string;
    client_version?: string;
}
export interface ExecutiveToken extends MaskedExecutiveToken {
    access_token?: string;
    token_type?: string;
}

