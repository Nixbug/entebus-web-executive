import { toast as sonnerToast } from 'svelte-sonner';

type ToastOpts = Record<string, any>;

const DEFAULT_DURATION = 5000;

export function success(message: string, options: ToastOpts = {}) {
	return sonnerToast.success(message, { duration: DEFAULT_DURATION, ...options });
}

export function error(message: string, options: ToastOpts = {}) {
	return sonnerToast.error(message, { duration: DEFAULT_DURATION, ...options });
}

export function warning(message: string, options: ToastOpts = {}) {
	return sonnerToast.warning(message, { duration: DEFAULT_DURATION, ...options });
}

export function info(message: string, options: ToastOpts = {}) {
	return sonnerToast.info(message, { duration: DEFAULT_DURATION, ...options });
}

export function notify(
	message: string,
	type: 'success' | 'error' | 'warning' | 'info' = 'info',
	options: ToastOpts = {}
) {
	switch (type) {
		case 'success':
			return success(message, options);
		case 'error':
			return error(message, options);
		case 'warning':
			return warning(message, options);
		default:
			return info(message, options);
	}
}

export const dismiss = (id?: string | number) => sonnerToast.dismiss(id as any);

export default { success, error, warning, info, notify, dismiss };
