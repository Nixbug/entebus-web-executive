import { z } from 'zod';

//-- Schema: validated string with trimming and spacing rules --
const cleanString = z
  .string()
  .trim()
  .refine((val) => val.length > 0, {
    message: "This field is required",
  })
  .refine((val) => !/\s{2,}/.test(val), {
    message: "Consecutive spaces are not allowed",
  });
const PASSWORD_PATTERN = /^[a-zA-Z0-9\-+,.@_$%&*#!^=\/?]*$/;

//-- Schema: login form --
export const loginSchema = z.object({
  username: cleanString
    .max(32, "Username must not exceed 32 characters"),
  password: cleanString
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must not exceed 32 characters")
    .regex(
      PASSWORD_PATTERN,
      "Password can only contain letters, numbers, and these special characters: - + , . @ _ $ % & * # ! ^ = / ?"
    ),
});

//-- Schema: executive account creation and update --
export const executiveAccountSchema = z.object({
  username: cleanString
    .min(4, "Username must be at least 4 characters")
    .max(32, "Username must be less than 32 characters"),

  password: cleanString
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must not exceed 32 characters")
    .regex(PASSWORD_PATTERN, "Password contains invalid characters"),

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
      (val) => !val || /^\d{10}$/.test(val),
      "Phone number must be exactly 10 digits"
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
