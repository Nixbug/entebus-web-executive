import { z } from 'zod';

//-- Schema: validated string with trimming and spacing rules --
const cleanString = z
  .string()
  .trim()
  .refine(
    (val) => val.length > 0,
    { message: "This field is required" }
  )
  .refine(
    (val) => !/\s{2,}/.test(val),
    { message: "Consecutive spaces are not allowed" }
  )
  .refine(
    (val) => val === val.trim(),
    { message: "Leading or trailing spaces are not allowed" }
  );

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(32, "Username must not exceed 32 characters"),

  password: z
    .string()
    .min(1, "Password is required")
    .max(32, "Password must not exceed 32 characters"),
});


export const executiveAccountSchema = z.object({
  username: cleanString
    .min(4, "Username must be at least 4 characters")
    .max(32, "Username must be less than 32 characters"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(4, "Password must be at least 4 characters")
    .max(32, "Password must be less than 32 characters")
    .refine((val) => val.trim().length === val.length, {
      message: "Password cannot have leading or trailing spaces",
    }),

  fullName: cleanString
    .min(4, "Full name must be at least 4 characters")
    .max(32, "Full name must be less than 32 characters")
    .refine(
      (val) => /^[A-Za-z ]+$/.test(val),
      "Full name can only contain letters and spaces"
    ),

  email: z
    .union([
      z.string().email("Invalid email address"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  phone: z
    .string()
    .optional()
    .transform((val) => (typeof val === "string" ? val.replace(/\s/g, "") : val))
    .refine(
      (val) => !val || /^\+?\d{10,15}$/.test(val),
      "Phone number must contain 10–15 digits, optionally starting with '+'"
    ),

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

  email: z
    .union([
      z.string().email("Invalid email address"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  phone: z
    .string()
    .optional()
    .transform((val) => (typeof val === "string" ? val.replace(/\s/g, "") : val))
    .refine(
      (val) => !val || /^\+?\d{10,15}$/.test(val),
      "Phone number must contain 10–15 digits, optionally starting with '+'"
    ),
  type: cleanString.min(1, "Type is required"),
});