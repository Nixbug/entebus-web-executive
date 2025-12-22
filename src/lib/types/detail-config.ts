import type { ZodSchema } from 'zod';
import type { SvelteComponentTyped } from 'svelte';

export type DetailFieldValue = string | number | boolean | Date | null;
export type DetailFieldRenderer = new (
    ...args: any[]
) => SvelteComponentTyped<{ value: DetailFieldValue }>;

//-- Detail configuration types --//
export interface DetailField {
    key: string;
    label: string;
    value: DetailFieldValue;
    type: 'text' | 'select' | 'date' | 'email' | 'phone' | 'custom';
    editable?: boolean;
    icon?: string;
    iconColor?: string;
    iconBg?: string;
    options?: string[];
    renderer?: DetailFieldRenderer;
    autoFocus?: boolean;
    required?: boolean;
}

//-- Section containing multiple detail fields --//
export interface DetailSection {
    title: string;
    fields: DetailField[];
}

//-- Main detail configuration interface --//
export interface DetailConfig<
    TEditable extends Record<string, unknown> = Record<string, unknown>,
    TSchema = unknown
> {
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
    validationSchema?: ZodSchema<TSchema>;
    validationMapping?: Partial<Record<keyof TEditable & string, string>>;
    prepareForValidation?: (data: TEditable) => TSchema;
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
