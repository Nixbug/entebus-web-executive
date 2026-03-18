<script lang="ts">
	import { Toaster as SonnerToaster } from 'svelte-sonner';
	export let duration: number = 5000;
</script>

<SonnerToaster
	{duration}
	closeButton
	richColors
	position="bottom-right"
	offset="80px"
	toastOptions={{
		unstyled: true,
		classes: {
			toast: 'toast-base',
			title: 'toast-title',
			description: 'toast-desc',
			actionButton: 'toast-action',
			closeButton: 'toast-close',
			success: 'toast-success',
			error: 'toast-error',
			warning: 'toast-warning',
			info: 'toast-info'
		}
	}}
/>

<style>
	:global(.toast-base) {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		padding: 0.75rem 1rem;
		position: relative;
		padding-right: 2.75rem;
		border-radius: 8px;
		box-shadow: 0 6px 18px rgba(2, 6, 23, 0.08);
		color: #0f172a;
		min-width: 220px;
		max-width: 420px;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			'Helvetica Neue',
			Arial;
		border: 1px solid rgba(2, 6, 23, 0.04);
	}
	:global(.toast-title) {
		font-weight: 600;
		margin: 0;
		font-size: 14px;
	}
	:global(.toast-desc) {
		margin: 0;
		font-size: 13px;
		color: rgba(15, 23, 42, 0.8);
	}
	:global(.toast-action) {
		margin-left: 0;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 6px 10px;
		border-radius: 6px;
		color: inherit;
	}
	:global(.toast-close) {
		opacity: 0.9;
		background: transparent;
		border: none;
		padding: 6px;
		cursor: pointer;
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		order: 99;
	}

	:global(.toast-success) {
		background: #ecfdf5;
		color: #065f46;
		border-left: 4px solid #10b981;
	}
	:global(.toast-error) {
		background: #fff1f2;
		color: #7f1d1d;
		border-left: 4px solid #ef4444;
	}
	:global(.toast-warning) {
		background: #fffbeb;
		color: #78350f;
		border-left: 4px solid #f59e0b;
	}
	:global(.toast-info) {
		background: #ecfeff;
		color: #064e3b;
		border-left: 4px solid #06b6d4;
	}

	:global(.toast-base) {
		pointer-events: auto;
	}
</style>
