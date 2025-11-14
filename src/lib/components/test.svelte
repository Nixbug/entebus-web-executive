<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export let fields: {
		name: string;
		label: string;
		placeholder?: string;
		type?: string;
		options?: string[];
		fullWidth?: boolean;
		required?: boolean;
	}[] = [];

	export let title = 'Add New Executive';
	export let submitText = 'Add Executive';
	export let open = false;

	let isMobile = false;

	// Detect screen size
	function checkMobile() {
		isMobile = window.innerWidth < 768;
	}

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});

	const dispatch = createEventDispatcher();

	let formData: Record<string, string> = {};
	let errors: Record<string, string> = {};

	// Initialize formData
	$: if (open) {
		formData = fields.reduce(
			(acc, field) => {
				acc[field.name] = '';
				return acc;
			},
			{} as Record<string, string>
		);
		errors = {};
	}

	function handleSubmit() {
		errors = {};

		let hasError = false;
		fields.forEach((field) => {
			if (field.required && !formData[field.name]?.trim()) {
				errors[field.name] = `${field.label} is required`;
				hasError = true;
			}
		});

		if (hasError) return;

		dispatch('submit', { ...formData });
		close();
	}

	function close() {
		open = false;
		dispatch('close');
	}

	// Helper to determine if field should be full width
	function isFullWidth(field: any, index: number) {
		return field.fullWidth || index === 0;
	}
</script>

{#if open}
	<!-- Desktop Modal (≥768px) -->
	{#if !isMobile}
		<div class="overlay desktop" on:click={close}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h2>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h10m0 0V2m0 10v10" />
						</svg>
						{title}
					</h2>
					<button class="close-btn" on:click={close}>×</button>
				</div>

				<form on:submit|preventDefault={handleSubmit} class="modal-form">
					<div class="fields-grid">
						{#each fields as field, i}
							<div class="field-wrapper" class:full-width={isFullWidth(field, i)}>
								<label for={field.name}>
									{field.label}
									{#if field.required}<span class="required">*</span>{/if}
								</label>

								{#if field.options}
									<select
										id={field.name}
										bind:value={formData[field.name]}
										class:has-error={errors[field.name]}
										required={field.required}
									>
										<option value="" disabled selected
											>{field.placeholder || 'Select ' + field.label.toLowerCase()}</option
										>
										{#each field.options as option}
											<option value={option}>{option}</option>
										{/each}
									</select>
								{:else}
									<input
										id={field.name}
										type={field.type || 'text'}
										placeholder={field.placeholder || ''}
										bind:value={formData[field.name]}
										class:has-error={errors[field.name]}
										required={field.required}
									/>
								{/if}

								{#if errors[field.name]}
									<small class="error">{errors[field.name]}</small>
								{/if}
							</div>
						{/each}
					</div>

					<div class="modal-actions">
						<button type="button" class="cancel-btn" on:click={close}>Cancel</button>
						<button type="submit" class="submit-btn">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
							>
								<path d="M20 6L9 17l-5-5" />
							</svg>
							{submitText}
						</button>
					</div>
				</form>
			</div>
		</div>
	{:else}
		<!-- Mobile Bottom Sheet (<768px) -->
		<div class="overlay mobile" on:click={close}>
			<div class="sheet" on:click|stopPropagation>
				<div class="handle"></div>

				<div class="mobile-header">
					<h2>{title}</h2>
				</div>

				<form on:submit|preventDefault={handleSubmit} class="mobile-form">
					<div class="mobile-fields">
						{#each fields as field}
							<div class="mobile-field" class:full-width={field.fullWidth}>
								<label for={field.name}>
									{field.label}
									{#if field.required}<span class="required">*</span>{/if}
								</label>

								{#if field.options}
									<select
										id={field.name}
										bind:value={formData[field.name]}
										class:has-error={errors[field.name]}
										required={field.required}
									>
										<option value="" disabled selected
											>{field.placeholder || 'Select ' + field.label.toLowerCase()}</option
										>
										{#each field.options as option}
											<option value={option}>{option}</option>
										{/each}
									</select>
								{:else}
									<input
										id={field.name}
										type={field.type || 'text'}
										placeholder={field.placeholder || ''}
										bind:value={formData[field.name]}
										class:has-error={errors[field.name]}
										required={field.required}
									/>
								{/if}

								{#if errors[field.name]}
									<small class="error">{errors[field.name]}</small>
								{/if}
							</div>
						{/each}
					</div>

					<div class="mobile-actions">
						<button type="submit" class="mobile-submit-btn">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
							>
								<path d="M20 6L9 17l-5-5" />
							</svg>
							{submitText}
						</button>
						<button type="button" class="mobile-cancel-btn" on:click={close}>Cancel</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
{/if}

<style>
	/* Common Styles */
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 10000;
		backdrop-filter: blur(4px);
	}

	label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.required {
		color: #ef4444;
	}

	input,
	select {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.975rem;
		transition: all 0.2s;
		width: 100%;
		box-sizing: border-box;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	input.has-error,
	select.has-error {
		border-color: #ef4444;
	}

	.error {
		color: #ef4444;
		font-size: 0.8rem;
		margin-top: 4px;
	}

	/* Desktop Modal Styles */
	.overlay.desktop {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.modal {
		background: white;
		border-radius: 12px;
		width: 90%;
		max-width: 560px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
		animation: fadeIn 0.2s ease-out;
	}

	.modal-header {
		padding: 20px 24px;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: sticky;
		top: 0;
		background: white;
		z-index: 1;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
		color: #111;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 28px;
		cursor: pointer;
		color: #666;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.close-btn:hover {
		color: #000;
	}

	.modal-form {
		padding: 24px;
	}

	.fields-grid {
		display: grid;
		gap: 16px;
		grid-template-columns: 1fr 1fr;
	}

	.field-wrapper.full-width {
		grid-column: 1 / -1;
	}

	.field-wrapper {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.modal-actions {
		margin-top: 24px;
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}

	.cancel-btn {
		padding: 10px 20px;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
	}

	.cancel-btn:hover {
		background: #f9fafb;
	}

	.submit-btn {
		padding: 10px 24px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 8px;
		transition: background-color 0.2s;
	}

	.submit-btn:hover {
		background: #2563eb;
	}

	/* Mobile Bottom Sheet Styles */
	.overlay.mobile {
		display: flex;
		align-items: flex-end;
	}

	.sheet {
		background: white;
		border-top-left-radius: 20px;
		border-top-right-radius: 20px;
		width: 100%;
		max-height: 80vh;
		overflow-y: auto;
		animation: slideUp 0.3s ease-out;
	}

	.handle {
		width: 36px;
		height: 4px;
		background: #c4c4c4;
		border-radius: 2px;
		margin: 12px auto 8px;
	}

	.mobile-header {
		padding: 12px 20px 8px;
		text-align: center;
		border-bottom: 1px solid #e5e7eb;
	}

	.mobile-header h2 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #111;
	}

	.mobile-form {
		padding: 0 20px 24px;
	}

	.mobile-fields {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 16px 0;
	}

	.mobile-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.mobile-field.full-width {
		width: 100%;
	}

	.mobile-actions {
		margin-top: 24px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.mobile-submit-btn {
		padding: 12px 16px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		order: -1;
	}

	.mobile-cancel-btn {
		padding: 12px 16px;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
	}

	/* Animations */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	/* Ensure proper scrolling */
	@media (max-height: 600px) {
		.modal {
			max-height: 95vh;
		}

		.sheet {
			max-height: 95vh;
		}
	}
</style>
