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
