<script lang="ts">
	import { isOffline, checkNow } from '$lib/stores/network-status';

	let checking = false;

	async function retry() {
		checking = true;
		await checkNow();
		checking = false;
	}
</script>

{#if $isOffline}
	<div class="overlay d-flex flex-column justify-content-center align-items-center vh-100">
		<div class="text-center px-3" style="max-width: 28rem;">
			<div class="icon mb-4">
				<i class="bi bi-wifi-off"></i>
			</div>
			<h2 class="fw-inter-700 mb-2">No Internet Connection</h2>
			<p class="text-muted fw-inter-400 mb-4">
				It looks like you're not connected to the internet. Please check your network settings and
				try again.
			</p>
			<button class="btn retry-btn fw-inter-600" on:click={retry} disabled={checking}>
				{#if checking}
					<span class="spinner-border spinner-border-sm me-2" role="status"></span>
					Checking...
				{:else}
					<i class="bi bi-arrow-clockwise me-2"></i>
					Retry
				{/if}
			</button>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: radial-gradient(rgba(4, 70, 105, 0.08), #fff 60%);
	}
	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 6rem;
		height: 6rem;
		border-radius: 50%;
		background: linear-gradient(135deg, #e8f4fd, #f0f4ff);
	}
	.icon i {
		font-size: 3rem;
		color: #6c757d;
	}
	.retry-btn {
		background: linear-gradient(90deg, #2033b1, #47c7ff 50%, #10c555);
		color: #fff;
		border: none;
		border-radius: 8px;
		padding: 12px 32px;
	}
	.retry-btn:hover:not(:disabled) {
		box-shadow: 0 8px 24px rgba(14, 201, 167, 0.35);
		color: #fff;
	}
	.retry-btn:disabled {
		opacity: 0.7;
		color: #fff;
	}
</style>
