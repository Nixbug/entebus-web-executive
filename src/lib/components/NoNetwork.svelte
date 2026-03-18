<script lang="ts">
	import { isOffline, checkNow } from '$lib/stores/network-status';

	let checking = false;

	async function retry() {
		checking = true;
		await Promise.all([checkNow(), new Promise((r) => setTimeout(r, 1000))]);
		checking = false;
	}
</script>

{#if $isOffline}
	<div class="overlay">
		<div class="glow glow-1"></div>
		<div class="glow glow-2"></div>

		<div class="content text-center px-3">
			<div class="icon-ring mb-4">
				<div class="icon-inner">
					<i class="bi bi-wifi-off"></i>
				</div>
			</div>

			<h2 class="fw-inter-700 mb-2 heading">No Internet Connection</h2>
			<p class="subtext fw-inter-400 mb-4">
				It looks like you're not connected to the internet.<br />
				Please check your network settings and try again.
			</p>

			<button class="retry-btn fw-inter-600" on:click={retry} disabled={checking}>
				{#if checking}
					<span class="spinner-border spinner-border-sm me-2" role="status"></span>
					Checking…
				{:else}
					<i class="bi bi-arrow-clockwise me-2"></i>
					Retry
				{/if}
			</button>

			<div class="pulse-dots mt-4">
				<span class="dot"></span>
				<span class="dot"></span>
				<span class="dot"></span>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #0b0f19;
		overflow: hidden;
	}

	.glow {
		position: absolute;
		border-radius: 50%;
		filter: blur(100px);
		opacity: 0.35;
		pointer-events: none;
	}
	.glow-1 {
		width: 420px;
		height: 420px;
		background: #2033b1;
		top: -10%;
		left: -8%;
		animation: drift 8s ease-in-out infinite alternate;
	}
	.glow-2 {
		width: 350px;
		height: 350px;
		background: #10c555;
		bottom: -8%;
		right: -6%;
		animation: drift 10s ease-in-out infinite alternate-reverse;
	}

	@keyframes drift {
		0% {
			transform: translate(0, 0) scale(1);
		}
		100% {
			transform: translate(30px, 20px) scale(1.12);
		}
	}

	.content {
		position: relative;
		max-width: 26rem;
		padding: 2.5rem 2rem;
		border-radius: 1.25rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(18px);
		-webkit-backdrop-filter: blur(18px);
	}

	.icon-ring {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 7rem;
		height: 7rem;
		border-radius: 50%;
		background: conic-gradient(from 180deg, #2033b1, #47c7ff, #10c555, #2033b1);
		padding: 4px;
		animation: spin-ring 6s linear infinite;
	}
	.icon-inner {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: #0b0f19;
	}
	.icon-inner i {
		font-size: 2.6rem;
		background: linear-gradient(135deg, #47c7ff, #10c555);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.heading {
		color: #eef1f6;
		font-size: 1.55rem;
		letter-spacing: -0.01em;
	}
	.subtext {
		color: #8891a4;
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.retry-btn {
		position: relative;
		background: linear-gradient(135deg, #2033b1, #47c7ff 50%, #10c555);
		color: #fff;
		border: none;
		border-radius: 10px;
		padding: 13px 38px;
		font-size: 0.95rem;
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.3s;
	}
	.retry-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow:
			0 0 20px rgba(32, 51, 177, 0.45),
			0 0 40px rgba(16, 197, 85, 0.2);
		color: #fff;
	}
	.retry-btn:active:not(:disabled) {
		transform: translateY(0);
	}
	.retry-btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
		color: #fff;
	}

	.pulse-dots {
		display: flex;
		gap: 8px;
		justify-content: center;
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #47c7ff;
		opacity: 0.5;
		animation: pulse 1.4s ease-in-out infinite;
	}
	.dot:nth-child(2) {
		animation-delay: 0.7s;
	}
	.dot:nth-child(3) {
		animation-delay: 0.8s;
	}

	@keyframes pulse {
		0%,
		80%,
		100% {
			opacity: 0.25;
			transform: scale(0.85);
		}
		40% {
			opacity: 1;
			transform: scale(1.2);
		}
	}
</style>
