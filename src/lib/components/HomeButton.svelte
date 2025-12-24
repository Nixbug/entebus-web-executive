<script lang="ts">
	import { goto } from '$app/navigation';

	//-- navigate to dashboard on click --
	const handleClick = () => {
		goto('/dashboard');
	};
</script>

<button class="btn p-0 home-btn" aria-label="Go to dashboard" on:click={handleClick}>
	<i class="bi bi-house home-icon"></i>
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
