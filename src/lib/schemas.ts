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
    username: z
    .string()
    .min(1, "Username is required")
    .max(32, "Username must not exceed 32 characters"),

  password: z
    .string()
    .min(1, "Password is required")
    .max(32, "Password must not exceed 32 characters"),
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(32, "Full name must not exceed 32 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits"),
  designation: z
    .string()
    .max(32, "Designation must not exceed 32 characters"),
  gender: z
    .string()
    .min(1, "Gender is required")
    .max(32, "Gender must not exceed 32 characters"),
});