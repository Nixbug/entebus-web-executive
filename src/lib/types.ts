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


export interface ExecutiveRole {
    id: number;
    name: string;
    manage_ex_token?: boolean;
    manage_op_token?: boolean;
    manage_ve_token?: boolean;
    create_executive?: boolean;
    update_executive?: boolean;
    delete_executive?: boolean;
    create_landmark?: boolean;
    update_landmark?: boolean;
    delete_landmark?: boolean;
    create_company?: boolean;
    update_company?: boolean;
    delete_company?: boolean;
    create_operator?: boolean;
    update_operator?: boolean;
    delete_operator?: boolean;
    create_business?: boolean;
    update_business?: boolean;
    delete_business?: boolean;
    create_route?: boolean;
    update_route?: boolean;
    delete_route?: boolean;
    create_bus?: boolean;
    update_bus?: boolean;
    delete_bus?: boolean;
    create_vendor?: boolean;
    update_vendor?: boolean;
    delete_vendor?: boolean;
    create_schedule?: boolean;
    update_schedule?: boolean;
    delete_schedule?: boolean;
    create_service?: boolean;
    update_service?: boolean;
    delete_service?: boolean;
    create_fare?: boolean;
    update_fare?: boolean;
    delete_fare?: boolean;
    create_duty?: boolean;
    update_duty?: boolean;
    delete_duty?: boolean;
    create_ex_role?: boolean;
    update_ex_role?: boolean;
    delete_ex_role?: boolean;
    create_op_role?: boolean;
    update_op_role?: boolean;
    delete_op_role?: boolean;
    create_ve_role?: boolean;
    update_ve_role?: boolean;
    delete_ve_role?: boolean;
}

export interface ExecutiveMapping {
    id: number;
    created_on: string;
    role_id: number;
    executive_id: number;
}