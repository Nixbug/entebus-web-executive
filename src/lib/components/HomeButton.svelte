<script lang="ts">
	import { goto } from '$app/navigation';

	const handleClick = () => {
		goto('/dashboard');
	};
</script>

<style>
	.home-btn {
		width: 60px;
		height: 60px;
		border-radius: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #fff;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05),
					0 0 0 1px rgba(0, 0, 0, 0.08);
		transition: all 0.2s ease;
	}

	.home-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
	}

	.home-icon {
		font-size: 1.5rem;
		color: #495057;
	}
</style>

<button class="btn p-0 border-0 home-btn" aria-label="home-button" on:click={handleClick}>
	<i class="bi bi-house home-icon"></i>
</button>
