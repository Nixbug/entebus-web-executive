<script lang="ts">
	export let id: string = '';
	export let name: string = '';
	export let onConfirm: () => void = () => {};
	export let onCancel: () => void = () => {};
</script>

<div
	class="modal-overlay"
	role="dialog"
	tabindex="0"
	on:click={onCancel}
	on:keydown={(e) => e.key === 'Escape' && onCancel()}
>
	<div
		class="modal-content"
		role="dialog"
		tabindex="0"
		aria-modal="true"
		aria-labelledby="delete-modal-title"
		aria-describedby="delete-modal-description"
		on:click|stopPropagation
		on:keydown={(e) => e.key === 'Escape' && onCancel()}
	>
		<div class="modal-header justify-content-center">
			<h3 id="delete-modal-title" class="modal-title">Confirm Deletion</h3>
		</div>

		<div class="modal-body">
			<p id="delete-modal-description" class="confirmation-text">
				<strong>{name}</strong>
				(ID: <strong>{id}</strong>) <br />
				Are you sure you want to delete?
			</p>
			<p class="warning-note">This action cannot be undone.</p>
		</div>

		<div class="modal-footer">
			<button class="btn cancel-btn" on:click={onCancel}> Cancel </button>
			<button class="btn confirm-btn" on:click={onConfirm}> Confirm </button>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 6000;
		animation: fadeIn 0.2s ease-out;
	}

	.modal-content {
		background: var(--bg-card);
		border-radius: 20px;
		width: 90%;
		max-width: 450px;
		border: 1px solid var(--border);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		overflow: hidden;
		animation: scaleIn 0.2s ease-out;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px;
		border-bottom: 1px solid var(--border);
	}

	.modal-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		text-align: center;
	}

	.modal-body {
		padding: 24px;
		text-align: center;
	}

	.confirmation-text {
		margin: 0 0 12px 0;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--text-primary);
	}

	.warning-note {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-muted);
		font-style: italic;
	}

	.modal-footer {
		display: flex;
		gap: 12px;
		padding: 20px 24px;
		border-top: 1px solid var(--border);
	}

	.btn {
		flex: 1;
		padding: 12px 20px;
		border: none;
		border-radius: 12px;
		font-weight: 500;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel-btn {
		background: var(--bg-primary);
		color: var(--text-primary);
		border: 1px solid var(--border);
	}

	.cancel-btn:hover {
		background: var(--bg-card);
		border-color: var(--text-muted);
	}

	.confirm-btn {
		background: var(--delete-btn);
		color: white;
	}

	.confirm-btn:hover {
		background: var(--clear-btn);
		transform: translateY(-1px);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.9);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
