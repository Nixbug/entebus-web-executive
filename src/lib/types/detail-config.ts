import type { ZodSchema } from 'zod';
import type { SvelteComponentTyped } from 'svelte';

export type DetailFieldValue = string | number | boolean | Date | null;
export type DetailFieldRenderer = new (
	...args: any[]
) => SvelteComponentTyped<{ value?: DetailFieldValue } & Record<string, any>>;

//-- Detail configuration types --//
export interface DetailField {
	key: string;
	label: string;
	value: DetailFieldValue;
	type:
		| 'text'
		| 'number'
		| 'select'
		| 'date'
		| 'email'
		| 'phone'
		| 'custom'
		| 'searchableSelect'
		| 'location-picker';
	editable?: boolean;
	disabled?: boolean;
	icon?: string;
	iconColor?: string;
	iconBg?: string;
	options?: string[];
	loadOptions?: (
		q?: string,
		limit?: number,
		offset?: number
	) => Promise<Array<{ id: number; name: string }>>;
	renderer?: DetailFieldRenderer;
	autoFocus?: boolean;
	required?: boolean;
	visibleWhenEditing?: boolean;
	visibleWhenViewing?: boolean;
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
	avatar?: {
		initials?: string;
		imageUrl?: string;
		color: string;
		name: string;
		registrationNumber?: string;
		icon?: string;
		designation?: string;
		isYou?: boolean;
		isActive?: boolean;
		statusText?: string;
		dashboardLink?: string;
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
