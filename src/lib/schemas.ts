import { z } from 'zod';

//-- Schema factory: validated string with spacing and length rules --
const cleanString = (fieldName: string) =>
	z
		.string()
		.refine((val) => val.length > 0, {
			message: `${fieldName} is required`
		})
		.refine((val) => !/^\s/.test(val), {
			message: `${fieldName} cannot start with a space`
		})
		.refine((val) => !/\s$/.test(val), {
			message: `${fieldName} cannot end with a space`
		})
		.refine((val) => !/\s{2,}/.test(val), {
			message: 'Consecutive spaces are not allowed'
		});

//-- helper: create a number schema that accepts numeric strings and treats empty string as missing --
const numberFromString = (numSchema: z.ZodNumber, requiredMessage = 'Field is required') =>
	z.preprocess(
		(val) => {
			if (typeof val === 'string') {
				const v = val.trim();
				if (v === '') return undefined;
				const n = Number(v);
				return Number.isNaN(n) ? val : n;
			}
			return val;
		},
		z.union([numSchema, z.undefined()]).refine((v) => v !== undefined, { message: requiredMessage })
	);

//-- Password pattern allowing letters, numbers, and specific special characters --
const PASSWORD_PATTERN = /^[a-zA-Z0-9\-+,.@_$%&*#!^=\/?]*$/;

//--phone number pattern: exactly 10 digits --
const phoneDigits = z
	.string()
	.transform((val) => (typeof val === 'string' ? val.replace(/\s/g, '') : val))
	.refine((val) => !val || /^\d{10}$/.test(val), 'Phone number must be exactly 10 digits');

const emailSchema = z
	.union([z.string().email('Invalid email address'), z.literal('')])
	.transform((val) => (val === '' ? undefined : val));

//-- Name pattern --
const NAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9 _.\-]*[A-Za-z0-9])?$/;

//-- Schema: login form --
export const loginSchema = z.object({
	username: cleanString('Username'),
	password: cleanString('Password')
});

//-- Schema: executive account creation and update --
export const executiveAccountSchema = z.object({
	username: cleanString('Username')
		.min(4, 'Username must be at least 4 characters')
		.max(32, 'Username must be less than 32 characters')
		.regex(
			/^[a-zA-Z][a-zA-Z0-9.@_\-]*$/,
			'Username must start with a letter and may contain letters, numbers, and the characters . - @ _'
		),

	password: cleanString('Password')
		.min(8, 'Password must be at least 8 characters')
		.max(32, 'Password must not exceed 32 characters')
		.regex(
			PASSWORD_PATTERN,
			'Password can only contain letters, numbers, and special characters: -+,.@_$%&*#!^=/?'
		),

	fullName: cleanString('Full name')
		.min(4, 'Full name must be at least 4 characters')
		.max(32, 'Full name must be less than 32 characters')
		.refine((val) => /^[A-Za-z ]+$/.test(val), 'Full name can only contain letters and spaces'),

	email: emailSchema.optional(),

	phone: phoneDigits.optional(),
	designation: z.preprocess(
		(val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
		z
			.string()
			.min(2, 'Designation must be at least 2 characters')
			.max(32, 'Designation must be less than 32 characters')
			.refine((val) => !/^\s/.test(val), 'Designation cannot start with a space')
			.refine((val) => !/\s$/.test(val), 'Designation cannot end with a space')
			.refine((val) => !/\s{2,}/.test(val), 'Consecutive spaces are not allowed')
			.optional()
	),
	gender: z.string().optional()
});

export const executiveAccountUpdateSchema = z.object({
	password: z.preprocess(
		(val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
		z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.max(32, 'Password must not exceed 32 characters')
			.refine((val) => !/^\s/.test(val), 'Password cannot start with a space')
			.refine((val) => !/\s$/.test(val), 'Password cannot end with a space')
			.refine((val) => !/\s{2,}/.test(val), 'Consecutive spaces are not allowed')
			.regex(
				PASSWORD_PATTERN,
				'Password can only contain letters, numbers, and special characters: -+,.@_$%&*#!^=/?'
			)
			.optional()
	),

	fullName: cleanString('Full name')
		.min(4, 'Full name must be at least 4 characters')
		.max(32, 'Full name must be less than 32 characters')
		.refine((val) => /^[A-Za-z ]+$/.test(val), 'Full name can only contain letters and spaces'),

	email: emailSchema.optional(),

	phone: phoneDigits.optional(),
	designation: z.preprocess(
		(val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
		z
			.string()
			.min(2, 'Designation must be at least 2 characters')
			.max(32, 'Designation must be less than 32 characters')
			.refine((val) => !/^\s/.test(val), 'Designation cannot start with a space')
			.refine((val) => !/\s$/.test(val), 'Designation cannot end with a space')
			.refine((val) => !/\s{2,}/.test(val), 'Consecutive spaces are not allowed')
			.optional()
	),
	gender: z.string().optional(),
	status: z.string().optional()
});

//-- schema: landmark creation and update --
export const landmarkSchema = z.object({
	name: cleanString('Landmark name')
		.min(2, 'Landmark name must be at least 2 characters')
		.max(32, 'Landmark name must be less than 32 characters')
		.regex(NAME_PATTERN, 'Enter a valid landmark name (letters, numbers, spaces, ., -, _)'),
	type: z.string().optional(),
	boundary: z.string().trim().min(1, 'Boundary is required')
});

//-- Schema: company creation and update --
export const companySchema = z.object({
	name: cleanString('Company name')
		.min(2, 'Company name must be at least 2 characters')
		.max(64, 'Company name must be less than 64 characters'),

	address: cleanString('Address')
		.min(2, 'Address must be at least 2 characters')
		.max(128, 'Address must be less than 128 characters'),

	location: z.string().trim().min(1, 'Location is required'),

	type: z.string().optional(),

	status: z.string().optional(),

	description: z.preprocess(
		(val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
		z
			.string()
			.min(2, 'Description must be at least 2 characters')
			.max(1024, 'Description must be less than 1024 characters')
			.refine((val) => !/^\s/.test(val), 'Description cannot start with a space')
			.refine((val) => !/\s$/.test(val), 'Description cannot end with a space')
			.refine((val) => !/\s{2,}/.test(val), 'Consecutive spaces are not allowed')
			.optional()
	)
});

//-- Schema: role creation and update --
export const roleNameSchema = cleanString('Role name')
	.min(3, 'Role name must be at least 3 characters')
	.max(32, 'Role name must be less than 32 characters')
	.regex(NAME_PATTERN, 'Enter a valid role name (letters, numbers, spaces, ., -, _)');

export const roleSchema = z.object({
	name: roleNameSchema,
	permissions: z.any().optional()
});

//-- schema: operator account creation and update --
export const operatorAccountSchema = z.object({
	username: cleanString('Username')
		.min(4, 'Username must be at least 4 characters')
		.max(32, 'Username must be less than 32 characters')
		.regex(
			/^[a-zA-Z][a-zA-Z0-9.@_\-]*$/,
			'Username must start with a letter and may contain letters, numbers, and the characters . - @ _'
		),

	password: cleanString('Password')
		.min(8, 'Password must be at least 8 characters')
		.max(32, 'Password must not exceed 32 characters')
		.regex(
			PASSWORD_PATTERN,
			'Password can only contain letters, numbers, and special characters: -+,.@_$%&*#!^=/?'
		),

	fullName: cleanString('Full name')
		.min(4, 'Full name must be at least 4 characters')
		.max(32, 'Full name must be less than 32 characters')
		.refine((val) => /^[A-Za-z ]+$/.test(val), 'Full name can only contain letters and spaces'),

	email: emailSchema.optional(),

	phone: phoneDigits.optional(),
	description: z.preprocess(
		(val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
		z
			.string()
			.min(2, 'Description must be at least 2 characters')
			.max(32, 'Description must be less than 32 characters')
			.refine((val) => !/^\s/.test(val), 'Description cannot start with a space')
			.refine((val) => !/\s$/.test(val), 'Description cannot end with a space')
			.refine((val) => !/\s{2,}/.test(val), 'Consecutive spaces are not allowed')
			.optional()
	),
	gender: z.string().optional(),
	type: z.string().optional()
});
export const operatorAccountUpdateSchema = z.object({
	password: z.preprocess(
		(val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
		z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.max(32, 'Password must not exceed 32 characters')
			.refine((val) => !/^\s/.test(val), 'Password cannot start with a space')
			.refine((val) => !/\s$/.test(val), 'Password cannot end with a space')
			.refine((val) => !/\s{2,}/.test(val), 'Consecutive spaces are not allowed')
			.regex(
				PASSWORD_PATTERN,
				'Password can only contain letters, numbers, and special characters: -+,.@_$%&*#!^=/?'
			)
			.optional()
	),

	fullName: cleanString('Full name')
		.min(4, 'Full name must be at least 4 characters')
		.max(32, 'Full name must be less than 32 characters')
		.refine((val) => /^[A-Za-z ]+$/.test(val), 'Full name can only contain letters and spaces'),

	email: emailSchema.optional(),

	phone: phoneDigits.optional(),
	description: z.preprocess(
		(val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
		z
			.string()
			.min(2, 'Description must be at least 2 characters')
			.max(32, 'Description must be less than 32 characters')
			.refine((val) => !/^\s/.test(val), 'Description cannot start with a space')
			.refine((val) => !/\s$/.test(val), 'Description cannot end with a space')
			.refine((val) => !/\s{2,}/.test(val), 'Consecutive spaces are not allowed')
			.optional()
	),
	gender: z.string().optional(),
	status: z.string().optional(),
	type: z.string().optional()
});

//-- Schema: company vehicle creation and update --
export const companyVehicleSchema = z.object({
	registrationNumber: cleanString('Registration number')
		.min(2, 'Registration number must be at least 2 characters')
		.max(32, 'Registration number must be less than 32 characters')
		.regex(
			/^[A-Z]{2}[0-9]{2}(?:[A-Z]{1,2})?[0-9]{1,4}$/,
			'Format: e.g., KA01AB1234 or KA011234 — 2 letters, 2 digits, optional 1-2 letters, 1-4 digits'
		),
	name: cleanString('Name')
		.min(2, 'Name must be at least 2 characters')
		.max(32, 'Name must be less than 32 characters'),
	capacity: numberFromString(
		z
			.number()
			.int('Capacity must be an integer')
			.positive('Capacity must be a positive number')
			.max(120, 'Capacity must be less than or equal to 120')
	),
	status: cleanString('Status').min(1, 'Status is required'),
	manufactured_on: cleanString('Manufactured on')
		.min(2, 'Manufactured on must be at least 2 characters')
		.max(32, 'Manufactured on must be less than 32 characters')
});

export const fareSchema = z.object({
	name: cleanString('Fare name')
		.min(3, 'Fare name must be at least 3 characters')
		.max(32, 'Fare name must be less than 32 characters')
		.regex(NAME_PATTERN, 'Fare name contains invalid characters')
});

export const routeSchema = z.object({
	name: cleanString('Route name')
		.min(3, 'Route name must be at least 3 characters')
		.max(32, 'Route name must be less than 32 characters')
		.regex(NAME_PATTERN, 'Invalid characters in route name'),
});
