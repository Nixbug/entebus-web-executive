import { toast as sonnerToast } from 'svelte-sonner';

type ToastOpts = Record<string, any>;

const DEFAULT_DURATION = 5000; //-- 5 seconds --

//-- success toast --
export function success(message: string, options: ToastOpts = {}) {
	return sonnerToast.success(message, { duration: DEFAULT_DURATION, ...options });
}

//-- error toast (skips empty/null messages to avoid blank toasts) --
export function error(message: string, options: ToastOpts = {}) {
	if (!message) return;
	return sonnerToast.error(message, { duration: DEFAULT_DURATION, ...options });
}

//-- warning toast --
export function warning(message: string, options: ToastOpts = {}) {
	return sonnerToast.warning(message, { duration: DEFAULT_DURATION, ...options });
}

//-- info toast --
export function info(message: string, options: ToastOpts = {}) {
	return sonnerToast.info(message, { duration: DEFAULT_DURATION, ...options });
}

//-- generic notify function that routes to the correct type --
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

//-- default export --
export default { success, error, warning, info, notify, dismiss };
