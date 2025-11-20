import { z } from 'zod';

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
  username: z.string().min(1, "Username is required").max(32),
  password: z.string().min(1, "Password is required").max(32),
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(32)
    .refine(
      (val) => /^[A-Za-z ]+$/.test(val),
      "Full name cannot contain numbers or special characters"
    ),


  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^\d{10,15}$/.test(val),
      "Phone number must be 10–15 digits"
    ),


  designation: z.string().max(32).optional(),
  gender: z.string().min(1, "Gender is required"),
});
