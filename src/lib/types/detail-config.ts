export interface DetailField {
    key: string;
    label: string;
    value: any;
    type: 'text' | 'select' | 'date' | 'email' | 'phone' | 'custom';
    editable?: boolean;
    icon?: string;
    iconColor?: string;
    iconBg?: string;
    options?: string[];
    renderer?: any;
}

export interface DetailSection {
    title: string;
    fields: DetailField[];
}

export interface DetailConfig {
    title: string;
    avatar: {
        initials: string;
        color: string;
        name: string;
        designation: string;
        isYou?: boolean;
        isActive?: boolean;
        statusText?: string;
    };
    sections: DetailSection[];
    actions?: {
        edit?: boolean;
        delete?: boolean;
        custom?: Array<{
            label: string;
            icon: string;
            action: () => void;
            color?: string;
        }>;
    };
}