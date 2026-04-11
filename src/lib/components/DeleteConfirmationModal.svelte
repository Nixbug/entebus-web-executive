<script lang="ts">
	export let id: string = '';
	export let name: string = '';
	export let sectionName: string = '';
	export let onConfirm: () => void | Promise<void> = () => {};
	export let onCancel: () => void = () => {};
	export let loading: boolean = false;
	export let confirmationLabel: string = '';
	export let confirmationValue: string = '';

	let confirmInput: string = '';
	let needsConfirmation: boolean = false;
	let confirmationMatches: boolean = true;
	$: needsConfirmation = Boolean(confirmationLabel && confirmationValue);
	$: confirmationMatches =
		!needsConfirmation ||
		confirmInput.trim().toLowerCase() === (confirmationValue ?? '').trim().toLowerCase();
</script>

<div
	class="modal-overlay"
	role="dialog"
	tabindex="0"
	on:click={() => !loading && onCancel()}
	on:keydown={(e) => e.key === 'Escape' && !loading && onCancel()}
>
	<div
		class="modal-content"
		role="dialog"
		tabindex="0"
		aria-modal="true"
		aria-labelledby="delete-modal-title"
		aria-describedby="delete-modal-description"
		on:click|stopPropagation
		on:keydown={(e) => e.key === 'Escape' && !loading && onCancel()}
	>
		<div class="modal-header justify-content-center">
			<h3 id="delete-modal-title" class="modal-title">Confirm Deletion</h3>
		</div>

		<div class="modal-body">
			<p id="delete-modal-description" class="confirmation-text">
				<strong>{name}</strong>
				(ID: <strong>{id}</strong>) <br />
				Are you sure you want to delete this {sectionName}?
			</p>
			{#if needsConfirmation}
				<div class="confirmation-input-wrapper">
					<label for="confirm-input" class="confirmation-input-label">
						Type <strong>{confirmationValue}</strong> to confirm
					</label>
					<input
						id="confirm-input"
						type="text"
						class="confirmation-input"
						bind:value={confirmInput}
						placeholder={`Enter ${confirmationLabel}`}
						autocomplete="off"
					/>
				</div>
			{/if}
			<p class="warning-note">This action cannot be undone.</p>
		</div>

		<div class="modal-footer">
			<button class="btn cancel-btn" on:click={onCancel} disabled={loading}> Cancel </button>
			<button
				class="btn confirm-btn"
				on:click={onConfirm}
				disabled={loading || !confirmationMatches}
				aria-busy={loading}
			>
				{#if loading}
					<span
						class="spinner"
						style="margin-right:8px; display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; vertical-align:middle;"
					></span>
				{:else}
					Confirm
				{/if}
			</button>
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

	.spinner {
		animation: spin 0.8s linear infinite;
		display: inline-block;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
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

	.confirmation-input-wrapper {
		margin: 16px 0 12px;
		text-align: left;
	}

	.confirmation-input-label {
		display: block;
		font-size: 0.875rem;
		color: var(--text-primary);
		margin-bottom: 8px;
	}

	.confirmation-input {
		width: 100%;
		padding: 10px 14px;
		border: 1px solid var(--border);
		border-radius: 10px;
		font-size: 0.95rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		transition: border-color 0.2s;
	}

	.confirmation-input:focus {
		outline: none;
		border-color: var(--delete-btn);
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
	}
</style>
