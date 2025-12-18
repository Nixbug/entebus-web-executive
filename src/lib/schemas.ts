import { z } from 'zod';

//-- Schema: validated string with trimming and spacing rules --
const cleanString = z
  .string()
  .trim()
  .refine((val) => val.length > 0, {
    message: "Field is required",
  })
  .refine((val) => !/\s{2,}/.test(val), {
    message: "Consecutive spaces are not allowed",
  });

//-- Password pattern allowing letters, numbers, and specific special characters --
const PASSWORD_PATTERN = /^[a-zA-Z0-9\-+,.@_$%&*#!^=\/?]*$/;

//--phone number pattern: exactly 10 digits --
const phoneDigits = z
  .string()
  .transform((val) => (typeof val === "string" ? val.replace(/\s/g, "") : val))
  .refine(
    (val) => !val || /^\d{10}$/.test(val),
    "Phone number must be exactly 10 digits"
  );

const emailSchema = z
  .union([
    z.string().email("Invalid email address"),
    z.literal(""),
  ])
  .transform((val) => (val === "" ? undefined : val));


//-- Schema: executive account creation and update --
export const executiveAccountSchema = z.object({
  username: cleanString
    .min(4, "Username must be at least 4 characters")
    .max(32, "Username must be less than 32 characters"),

  password: cleanString
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must not exceed 32 characters")
    .regex(PASSWORD_PATTERN, "Password can only contain letters, numbers, and special characters: -+,.@_$%&*#!^=/?"
    ),

  fullName: cleanString
    .min(4, "Full name must be at least 4 characters")
    .max(32, "Full name must be less than 32 characters")
    .refine(
      (val) => /^[A-Za-z ]+$/.test(val),
      "Full name can only contain letters and spaces"
    ),

  email: emailSchema.optional(),

  phone: phoneDigits.optional(),
  designation: z
    .string()
    .optional()
    .transform((val) => (typeof val === "string" ? val.trim() : val))
    .refine(
      (val) => !val || (val.length >= 2 && !/\s{2,}/.test(val)),
      "Designation must be at least 2 characters and cannot have consecutive spaces"
    ),

  gender: cleanString.min(1, "Gender is required"),
});


export const companySchema = z.object({
  name: cleanString
    .min(2, "Company name must be at least 2 characters")
    .max(64, "Company name must be less than 64 characters"),

  ownerName: cleanString
    .min(2, "Owner name must be at least 2 characters")
    .max(64, "Owner name must be less than 64 characters"),

  address: cleanString
    .min(2, "Address must be at least 2 characters")
    .max(128, "Address must be less than 128 characters"),

  location: cleanString
    .min(2, "Location must be at least 2 characters")
    .max(64, "Location must be less than 64 characters"),

  email: emailSchema.optional(),

  phone: phoneDigits.optional(),
  type: cleanString.min(1, "Type is required"),
});
