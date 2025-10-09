import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string()
    .nonempty('Username is required')
    .min(4, 'Username must be at least 4 characters')
    .max(32, 'Username must be at most 32 characters'),
    password: z.string()
    .nonempty('Username is required')
    .min(8, 'Password must be at least 8 characters')
    .max(32, 'Password must be at most 32 characters')
});
