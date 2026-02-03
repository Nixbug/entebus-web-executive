// Using dynamic env to allow fallback when variable is not set
// This is evaluated at runtime to allow fallback when variable is not set
import { env } from '$env/dynamic/public';

export const BASE_URL = env.PUBLIC_BASE_URL || 'http://localhost:5173';
