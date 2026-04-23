<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let isOpen: boolean = false;

	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
	}

	const rules = [
		{
			number: '01',
			text: 'First landmark distance must be zero.'
		},
		{
			number: '02',
			text: "First landmark arrival and departure time must equal the route's starting time."
		},
		{
			number: '03',
			text: 'Distance values must be unique — no repeats allowed.'
		},
		{
			number: '04',
			text: 'Time and distance must increase gradually across landmarks.'
		},
		{
			number: '05',
			text: 'For the last landmark, arrival and departure time must be equal.'
		}
	];
</script>

{#if isOpen}
	<div class="rim-backdrop" on:click={close} role="presentation">
		<div
			class="rim-card"
			on:click|stopPropagation
			role="dialog"
			aria-modal="true"
			aria-labelledby="rim-title"
			tabindex="0"
			on:keydown={(e) => {
				if (e.key === 'Escape') {
					e.preventDefault();
					close();
				}
			}}
		>
			<!-- Header -->
			<div class="rim-header">
				<div class="rim-icon-wrap">
					<i class="bi bi-signpost-2"></i>
				</div>
				<div class="rim-header-text">
					<p class="rim-eyebrow">Route configuration</p>
					<h5 class="rim-title" id="rim-title">Landmark creation rules</h5>
				</div>
				<button class="rim-close-btn" aria-label="Close" on:click={close}>
					<i class="bi bi-x-lg"></i>
				</button>
			</div>

			<!-- Subtitle -->
			<p class="rim-subtitle">
				Follow these rules when adding landmarks — otherwise the route will not become valid.
			</p>

			<!-- Rules list -->
			<ol class="rim-rules">
				{#each rules as rule}
					<li class="rim-rule-item">
						<span class="rim-rule-number">{rule.number}</span>
						<span class="rim-rule-text">{rule.text}</span>
					</li>
				{/each}
			</ol>

			<!-- Footer -->
			<div class="rim-footer">
				<button class="rim-confirm-btn" on:click={close}> Got it </button>
			</div>
		</div>
	</div>
{/if}

<style>
	.rim-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		padding: 1rem;
		backdrop-filter: blur(2px);
	}

	.rim-card {
		width: 100%;
		max-width: 560px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
		animation: rim-slide-in 0.2s ease;
	}

	@keyframes rim-slide-in {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Header */
	.rim-header {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		margin-bottom: 1rem;
	}

	.rim-icon-wrap {
		flex-shrink: 0;
		width: 42px;
		height: 42px;
		border-radius: 10px;
		background: var(--bs-primary, #0d6efd);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-size: 1.1rem;
		opacity: 0.92;
	}

	.rim-header-text {
		flex: 1;
		min-width: 0;
	}

	.rim-eyebrow {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--bs-primary, #0d6efd);
		margin: 0 0 0.1rem;
		opacity: 0.85;
	}

	.rim-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.3;
	}

	.rim-close-btn {
		flex-shrink: 0;
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 6px;
		line-height: 1;
		font-size: 0.95rem;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.rim-close-btn:hover {
		background: var(--bg-hover, rgba(0, 0, 0, 0.06));
		color: var(--text-primary);
	}

	/* Subtitle */
	.rim-subtitle {
		font-size: 0.82rem;
		color: var(--text-muted);
		margin: 0 0 1.25rem;
		line-height: 1.5;
	}

	/* Rules */
	.rim-rules {
		list-style: none;
		padding: 0;
		margin: 0 0 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.rim-rule-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.7rem 0.875rem;
		border-radius: 10px;
		background: var(--bg-primary, rgba(0, 0, 0, 0.03));
		border: 1px solid var(--border, rgba(0, 0, 0, 0.07));
		transition: border-color 0.15s;
	}

	.rim-rule-item:hover {
		border-color: var(--bs-primary, #0d6efd);
	}

	.rim-rule-number {
		flex-shrink: 0;
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--bs-primary, #0d6efd);
		letter-spacing: 0.04em;
		margin-top: 0.05rem;
		opacity: 0.8;
	}

	.rim-rule-text {
		font-size: 0.84rem;
		color: var(--text-primary);
		line-height: 1.5;
	}

	/* Footer */
	.rim-footer {
		display: flex;
		justify-content: flex-end;
	}

	.rim-confirm-btn {
		padding: 0.5rem 1.5rem;
		border-radius: 8px;
		border: none;
		background: var(--bs-primary, #0d6efd);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			opacity 0.15s,
			transform 0.1s;
	}

	.rim-confirm-btn:hover {
		opacity: 0.9;
	}

	.rim-confirm-btn:active {
		transform: scale(0.97);
	}
</style>
