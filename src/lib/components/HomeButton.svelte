<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	//-- Props --
	export let icon: string = 'bi bi-house';
	export let to: string | null = '/dashboard';
	export let ariaLabel: string = 'Go to dashboard';
	export let preserveQuery: boolean = false; //-- When true, append current URL search params to `to` when navigating --

	//-- If onClick is provided, navigation via `to` is skipped. --
	const handleClick = (e?: MouseEvent) => {
		if (!to) return;

		let target = to;
		if (preserveQuery) {
			const params = $page.url.searchParams.toString();
			if (params && params.length) {
				target = `${to}${to.includes('?') ? '&' : '?'}${params}`;
			}
		}

		goto(target);
	};
</script>

<button class="btn p-0 home-btn" aria-label={ariaLabel} on:click={handleClick}>
	<i class={icon + ' home-icon'}></i>
</button>

<!-- Styles -->
<style>
	.home-btn {
		width: 40px;
		height: 40px;
		border-radius: 15px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--bg-card);
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.05),
			0 0 0 1px rgba(0, 0, 0, 0.08);
		transition: all 0.2s ease;
		border: 1px solid var(--border);
		margin-bottom: 0.5rem;
	}

	.home-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
		outline: var(--home-button-bg) solid 2px;
	}

	.home-icon {
		font-size: 1.5rem;
		color: var(--text-muted);
	}
	.home-icon:hover {
		color: var(--home-button-bg);
	}
</style>
