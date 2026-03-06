export const handleApiError = async (err: any): Promise<string> => {
	const MAX_BODY_CHARS = 8192;

	// Network / fetch failure
	if (!err?.response) return 'Network error. Check your connection.';

	const status = err.response.status;

	// Prefer already-parsed body if caller provided it
	let body = err.body ?? null;

	// Read and parse response body (safe, truncated)
	if (!body) {
		try {
			const rawText = await err.response.clone().text();
			if (rawText) {
				const text = rawText.length > MAX_BODY_CHARS ? rawText.slice(0, MAX_BODY_CHARS) + '...' : rawText;
				try {
					body = JSON.parse(text);
				} catch {
					body = { message: text };
				}
			}
		} catch {
			body = null;
		}
	}

	const sanitizeForLog = (input: any): any => {
		if (!input) return input;
		if (typeof input !== 'object') return input;
		if (Array.isArray(input)) return input.map(sanitizeForLog);
		const copy: any = {};
		for (const k of Object.keys(input)) {
			if (['accessToken', 'refreshToken', 'access_token', 'refresh_token', 'password', 'token'].includes(k)) {
				copy[k] = '[REDACTED]';
			} else {
				copy[k] = input[k];
			}
		}
		return copy;
	};

	// Client errors (400-499): prefer server-provided messages when available
	if (status >= 400 && status < 500) {
		if (body) {
			if (body.detail) {
				const detail = body.detail;
				if (Array.isArray(detail)) return detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
				if (typeof detail === 'string') return detail;
				if (typeof detail === 'object' && detail.message) return detail.message;
			}

			if (body.errors && Array.isArray(body.errors)) return body.errors.map((e: any) => e.message || e).join(', ');
			if (body.error && typeof body.error === 'string') return body.error;
			if (body.message && typeof body.message === 'string') return body.message;
		}

		// sensible fallbacks for auth/permission issues
		if (status === 401) return 'Invalid username or password';
		if (status === 403) return 'You do not have permission to perform this action';

		return `Request failed (${status})`;
	}

	// Server errors: mask details for users but log sanitized body for debugging
	if (status >= 500) {
		try {
			console.error('Server error response:', sanitizeForLog(body));
		} catch (e) {
			// ignore logging failures
		}
		return 'Server error. Please try again later.';
	}

	// Generic handling for other cases
	if (body) {
		if (body.detail) {
			const detail = body.detail;
			if (Array.isArray(detail)) return detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
			if (typeof detail === 'string') return detail;
			if (typeof detail === 'object' && detail.message) return detail.message;
		}
		if (body.message && typeof body.message === 'string') return body.message;
		if (body.error && typeof body.error === 'string') return body.error;
	}

	return err?.response?.statusText || err?.message || 'An unexpected error occurred';
};
