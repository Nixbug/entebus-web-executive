import { writable } from 'svelte/store';

export interface ToastMessage {
	id: number;
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
}

function createToastStore() {
	const { subscribe, update } = writable<ToastMessage[]>([]);

	function show(message: string, type: ToastMessage['type'] = 'info') {
		const id = Date.now();
		update((t) => [...t, { id, message, type }]);
		setTimeout(() => dismiss(id), 3000); 
	}

	function dismiss(id: number) {
		update((t) => t.filter((toast) => toast.id !== id));
	}

	return { subscribe, show, dismiss };
}

export const toastStore = createToastStore();
