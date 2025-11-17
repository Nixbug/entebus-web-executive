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
  fullName: z.string().min(1, "Full name is required").max(32),

  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits")
    .optional()
    .or(z.literal("")),

  designation: z.string().max(32).optional(),
  
  gender: z.string().min(1, "Gender is required"),
});
