//-- Breakpoint constants for responsive design --//
export const DESKTOP_BREAKPOINT: number = 1024;
export const MOBILE_BREAKPOINT: number = 768;

//-- Debounce delay for map search input (in milliseconds) --
export const SEARCH_DEBOUNCE_DELAY: number = 500;

//-- Gender enumeration values from backend --
export const GENDER = {
	OTHER: 1,
	FEMALE: 2,
	MALE: 3,
	TRANSGENDER: 4
} as const;

export type GenderEnum = (typeof GENDER)[keyof typeof GENDER];

export const GENDER_LABEL_BY_VALUE: Record<GenderEnum, string> = {
	1: 'Other',
	2: 'Female',
	3: 'Male',
	4: 'Transgender'
};

export const GENDER_VALUE_BY_LABEL: Record<string, GenderEnum> = {
	Other: GENDER.OTHER,
	Female: GENDER.FEMALE,
	Male: GENDER.MALE,
	Transgender: GENDER.TRANSGENDER
};

export const GENDER_FILTER_OPTIONS = ['All Genders', ...Object.values(GENDER_LABEL_BY_VALUE)];

//-- Status enumeration values from backend --
export const STATUS = {
	ACTIVE: 1,
	SUSPENDED: 2
} as const;

export type StatusEnum = (typeof STATUS)[keyof typeof STATUS];

export const STATUS_LABEL_BY_VALUE: Record<StatusEnum, string> = {
	1: 'Active',
	2: 'Suspended'
};

export const STATUS_VALUE_BY_LABEL: Record<string, StatusEnum> = {
	Active: STATUS.ACTIVE,
	Suspended: STATUS.SUSPENDED
};

export const STATUS_FILTER_OPTIONS = ['All Status', ...Object.values(STATUS_LABEL_BY_VALUE)];
