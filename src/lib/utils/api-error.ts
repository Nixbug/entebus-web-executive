/**
 * Handles an API error by returning a Promise that resolves to a string.
 * If the error is a network or fetch failure, it returns a string indicating so.
 * If the error is a client error (400-499), it prefers server-provided messages when available.
 * If the error is a server error (500+), it logs a sanitized version of the error body for debugging.
 * If no server-provided message is available, it returns a generic error message.
 * @param {any} err The error object from the API call.
 * @returns {Promise<string>} A Promise that resolves to a string describing the error.
 */
export const handleApiError = async (err: any): Promise<string | null> => {
	const isApiResult = err && typeof err === 'object' && 'status' in err && 'data' in err;
	const hasResponseShape = !!err?.response;

	//-- If session was already expired and handled globally, skip duplicate error message --
	if (isApiResult && err.sessionExpired) return null;

	if (!isApiResult && !hasResponseShape) return 'Network error. Check your connection.';

	//-- Attempt to extract status and body from the error object --
	const status = isApiResult ? err.status : err.response.status;
	let body = isApiResult ? (err.data ?? err.body ?? null) : (err.body ?? null);

	const sanitizeForLog = (input: any): any => {
		if (!input) return input;
		if (typeof input !== 'object') return input;
		if (Array.isArray(input)) return input.map(sanitizeForLog);
		const copy: any = {};
		for (const key of Object.keys(input)) {
			if (
				[
					'accessToken',
					'refreshToken',
					'access_token',
					'refresh_token',
					'password',
					'token'
				].includes(key)
			) {
				copy[key] = '[REDACTED]';
			} else {
				copy[key] = input[key];
			}
		}
		return copy;
	};

	//-- Client errors (400-499): prefer server-provided messages when available --
	if (status >= 400 && status < 500) {
		if (body) {
			if (body.detail) {
				const detail = body.detail;
				if (Array.isArray(detail))
					return detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
				if (typeof detail === 'string') return detail;
				if (typeof detail === 'object' && detail.message) return detail.message;
			}

			if (body.errors && Array.isArray(body.errors))
				return body.errors.map((e: any) => e.message || e).join(', ');
			if (body.error && typeof body.error === 'string') return body.error;
			if (body.message && typeof body.message === 'string') return body.message;
		}

		//-- Sensible fallbacks for auth/permission issues --
		if (status === 401) return 'Invalid username or password';
		if (status === 403) return 'You do not have permission to perform this action';

		return `Request failed (${status})`;
	}

	//-- Server errors: mask details for users but log sanitized body for debugging --
	if (status >= 500) {
		try {
			console.error('Server error response:', sanitizeForLog(body));
		} catch (e) {
			//-- ignore logging failures --
		}
		return 'Server error. Please try again later.';
	}

	//-- Generic handling for other cases --
	if (body) {
		if (body.detail) {
			const detail = body.detail;
			if (Array.isArray(detail))
				return detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
			if (typeof detail === 'string') return detail;
			if (typeof detail === 'object' && detail.message) return detail.message;
		}
		if (body.message && typeof body.message === 'string') return body.message;
		if (body.error && typeof body.error === 'string') return body.error;
	}

	return err?.response?.statusText || err?.message || 'An unexpected error occurred';
};
