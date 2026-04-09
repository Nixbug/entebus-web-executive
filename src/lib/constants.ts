//-- Breakpoint constants for responsive design --//
export const DESKTOP_BREAKPOINT: number = 1024;
export const MOBILE_BREAKPOINT: number = 768;

//-- Search debounce delay --
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

//-- landmark type enumeration values from backend --
export const LANDMARK_TYPE = {
	LOCAL: 1,
	VILLAGE: 2,
	DISTRICT: 3,
	STATE: 4,
	NATIONAL: 5
} as const;

export type LandmarkTypeEnum = (typeof LANDMARK_TYPE)[keyof typeof LANDMARK_TYPE];

export const LANDMARK_TYPE_LABEL_BY_VALUE: Record<LandmarkTypeEnum, string> = {
	1: 'Local',
	2: 'Village',
	3: 'District',
	4: 'State',
	5: 'National'
};

export const LANDMARK_TYPE_VALUE_BY_LABEL: Record<string, LandmarkTypeEnum> = {
	Local: LANDMARK_TYPE.LOCAL,
	Village: LANDMARK_TYPE.VILLAGE,
	District: LANDMARK_TYPE.DISTRICT,
	State: LANDMARK_TYPE.STATE,
	National: LANDMARK_TYPE.NATIONAL
};

export const LANDMARK_TYPE_FILTER_OPTIONS = [
	'All Types',
	...Object.values(LANDMARK_TYPE_LABEL_BY_VALUE)
];

//-- Company type enumeration values from backend --
export const COMPANY_TYPE = {
	OTHER: 1,
	PRIVATE: 2,
	GOVERNMENT: 3
} as const;

export type CompanyTypeEnum = (typeof COMPANY_TYPE)[keyof typeof COMPANY_TYPE];

export const COMPANY_TYPE_LABEL_BY_VALUE: Record<CompanyTypeEnum, string> = {
	1: 'Other',
	2: 'Private',
	3: 'Government'
};

export const COMPANY_TYPE_VALUE_BY_LABEL: Record<string, CompanyTypeEnum> = {
	Other: COMPANY_TYPE.OTHER,
	Private: COMPANY_TYPE.PRIVATE,
	Government: COMPANY_TYPE.GOVERNMENT
};

export const COMPANY_TYPE_FILTER_OPTIONS = [
	'All Types',
	...Object.values(COMPANY_TYPE_LABEL_BY_VALUE)
];

//-- Company status enumeration values from backend --
export const COMPANY_STATUS = {
	UNDER_VERIFICATION: 1,
	VERIFIED: 2,
	SUSPENDED: 3
} as const;

export type CompanyStatusEnum = (typeof COMPANY_STATUS)[keyof typeof COMPANY_STATUS];

export const COMPANY_STATUS_LABEL_BY_VALUE: Record<CompanyStatusEnum, string> = {
	1: 'Under Verification',
	2: 'Verified',
	3: 'Suspended'
};

export const COMPANY_STATUS_VALUE_BY_LABEL: Record<string, CompanyStatusEnum> = {
	'Under Verification': COMPANY_STATUS.UNDER_VERIFICATION,
	Verified: COMPANY_STATUS.VERIFIED,
	Suspended: COMPANY_STATUS.SUSPENDED
};

export const COMPANY_STATUS_FILTER_OPTIONS = [
	'All Status',
	...Object.values(COMPANY_STATUS_LABEL_BY_VALUE)
];
