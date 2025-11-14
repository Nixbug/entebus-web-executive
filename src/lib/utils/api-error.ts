export const handleApiError = (err: any): string => {

    //-- Network / Fetch failure --
    if (!err?.response) {
        return 'Network error. Check your connection.';
    }

    const status = err.response.status;
    const body = err.body;

    //-- Handle known HTTP status codes --
    if (status === 401) {
        return 'Invalid username or password';
    }

    if (status === 403) {
        return 'You do not have permission to perform this action';
    }

    if (status === 404) {
        return 'Resource not found';
    }

    if (status >= 500) {
        return 'Server error. Please try again later.';
    }

    //-- Handle OpenAPI error body --
    if (body?.detail) {
        const detail = body.detail;

        if (Array.isArray(detail)) {
            //-- Validation errors: [{ msg: "..." }, ...] --
            return detail.map((d: any) => d.msg).join(', ');
        }

        if (typeof detail === 'string') {
            return detail;
        }
    }

    //-- Fallback: raw message or generic --
    return body?.message || 'An unexpected error occurred';
};
