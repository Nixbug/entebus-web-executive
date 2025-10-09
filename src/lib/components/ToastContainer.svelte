<script lang="ts">
	import { toastStore } from '$lib/stores/toastStore';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let toasts: any = [];
	const unsubscribe = toastStore.subscribe((v) => (toasts = v));
	onMount(() => unsubscribe);
</script>

<div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1100;">
	{#each toasts as toast (toast.id)}
		<div
			class="toast align-items-center text-bg-{toast.type === 'error'
				? 'danger'
				: toast.type} show mb-2 shadow"
			role="alert"
			transition:fly={{ x: 100, duration: 200 }}
		>
			<div class="d-flex">
				<div class="toast-body">{toast.message}</div>
				<button
					type="button"
					class="btn-close btn-close-white me-2 m-auto"
					on:click={() => toastStore.dismiss(toast.id)}
					aria-label="Close toast"
				></button>
			</div>
		</div>
	{/each}
</div>
