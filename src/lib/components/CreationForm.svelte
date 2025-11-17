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
	export let submitText = 'Save';
	export let open = false;
	export let schema: any = null;

	let isMobile = false;

	// Detect screen size
	function checkMobile() {
		isMobile = window.innerWidth < 768;
	}

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		const handleKeydown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && open) close();
		};
		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('resize', checkMobile);
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	const dispatch = createEventDispatcher();

	function getFieldId(name: string) {
		return `field-${String(name).replace(/\s+/g, '-').toLowerCase()}`;
	}

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
		errors = {}; // Reset errors

		if (schema) {
			const result = schema.safeParse(formData);
			if (!result.success) {
				// Flatten Zod errors and take the first message per field
				const fieldErrors = result.error.flatten().fieldErrors;
				for (const [key, msgs] of Object.entries(fieldErrors)) {
					if (msgs && msgs.length > 0) {
						errors[key] = msgs[0]; // Use the first error message for simplicity
					}
				}
				return; // Stop submission if validation fails
			}
		} else {
			// Optional: Fallback to basic required checks if no schema is provided
			let hasError = false;
			fields.forEach((field) => {
				if (field.required && !formData[field.name]?.trim()) {
					errors[field.name] = `${field.label} is required`;
					hasError = true;
				}
			});
			if (hasError) return;
		}

		// If valid, dispatch the submit event with form data
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
	{#if !isMobile}
		<!-- Desktop Modal -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="modal fade show d-block"
			tabindex="-1"
			role="dialog"
			on:click={close}
			on:keydown={(e) => e.key === 'Escape' && close()}
		>
			<div
				class="modal-dialog modal-dialog-centered"
				role="document"
				on:click|stopPropagation
				on:keydown|stopPropagation
			>
				<form class="modal-content" on:submit|preventDefault={handleSubmit}>
					<div class="modal-header">
						<h5 class="modal-title">{title}</h5>
						<button type="button" class="btn-close" aria-label="Close" on:click={close}></button>
					</div>

					<div class="modal-body">
						<div class="row g-3 p-3">
							{#each fields as field, i}
								<div class={isFullWidth(field, i) ? 'col-12' : 'col-md-6'}>
									<label class="form-label" for={getFieldId(field.name)}>
										{field.label}
										{#if field.required}<span class="text-danger">*</span>{/if}
									</label>

									{#if field.options}
										<select
											id={getFieldId(field.name)}
											class="form-select {errors[field.name] ? 'is-invalid' : ''}"
											bind:value={formData[field.name]}
										>
											<option value="" disabled>Select {field.label}</option>
											{#each field.options as option}
												<option value={option}>{option}</option>
											{/each}
										</select>
									{:else}
										<input
											id={getFieldId(field.name)}
											type={field.type || 'text'}
											class="form-control {errors[field.name] ? 'is-invalid' : ''}"
											bind:value={formData[field.name]}
											placeholder={field.placeholder}
										/>
									{/if}

									{#if errors[field.name]}
										<div class="invalid-feedback d-block">
											{errors[field.name]}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<div class="modal-footer d-flex gap-2 w-100 p-3">
						<button
							type="button"
							class="btn cancel-btn flex-fill d-flex justify-content-center"
							on:click={close}
						>
							Cancel
						</button>
						<button type="submit" class="btn btn-primary flex-fill d-flex justify-content-center">
							{submitText}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if isMobile}
		<!-- Mobile Bottom Sheet -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="mobile-overlay" role="button" aria-label="Close dialog" on:click={close}>
			<div
				class="mobile-sheet"
				role="dialog"
				aria-modal="true"
				aria-labelledby="cf-title"
				on:click|stopPropagation
			>
				<div class="handle"></div>

				<h5 id="cf-title" class="text-center fw-semibold mb-3">{title}</h5>

				<form class="px-3 pb-3" on:submit|preventDefault={handleSubmit}>
					<div class="d-flex flex-column gap-3">
						{#each fields as field}
							<div>
								<label class="form-label" for={getFieldId(field.name)}>
									{field.label}
									{#if field.required}<span class="text-danger">*</span>{/if}
								</label>
								{#if field.options}
									<select
										id={getFieldId(field.name)}
										class="form-select {errors[field.name] ? 'is-invalid' : ''}"
										bind:value={formData[field.name]}
									>
										<option value="" disabled>Select {field.label}</option>
										{#each field.options as option}
											<option value={option}>{option}</option>
										{/each}
									</select>
								{:else}
									<input
										id={getFieldId(field.name)}
										type={field.type || 'text'}
										class="form-control {errors[field.name] ? 'is-invalid' : ''}"
										bind:value={formData[field.name]}
										placeholder={field.placeholder}
									/>
								{/if}

								{#if errors[field.name]}
									<div class="invalid-feedback d-block">
										{errors[field.name]}
									</div>
								{/if}
							</div>
						{/each}
					</div>

					<div class="d-flex flex-column mt-4 gap-2">
						<button type="submit" class="btn btn-primary d-flex justify-content-center gap-2">
							{submitText}
						</button>

						<button type="button" class="btn cancel-btn" on:click={close}> Cancel </button>
					</div>
				</form>
			</div>
		</div>
	{/if}
{/if}

<style>
	.mobile-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: flex-end;
		z-index: 9999;
	}

	.mobile-sheet {
		background: var(--bg-primary);
		width: 100%;
		border-top-left-radius: 18px;
		border-top-right-radius: 18px;
		max-height: 80vh;
		overflow-y: auto;
		animation: slideUp 0.3s ease-out;
	}

	.handle {
		width: 40px;
		height: 5px;
		background: var(--text-primary);
		border-radius: 4px;
		margin: 10px auto;
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.modal-content,
	.mobile-sheet {
		background: var(--bg-primary) !important;
		color: var(--text-primary);
	}
	.form-label {
		color: var(--text-primary) !important;
	}
	.form-control,
	.form-select {
		background: var(--bg-card) !important;
		color: var(--text-primary) !important;
		border-radius: 8px !important; /* more curved */
		border: 1px solid var(--border-color, #444) !important;
		height: 48px !important; /* increased height */
	}
	.form-control::placeholder,
	.form-select::placeholder {
		color: var(--text-muted) !important;
		opacity: 1;
	}

	.cancel-btn {
		background: var(--bg-card) !important;
		color: var(--text-primary);
		border: 1px solid var(--border) !important;
	}
	.modal-content {
		border-radius: 12px;
		border: 1px solid var(--border-color, #444);
	}

	.handle {
		background: var(--border);
	}
	.modal-content {
		border: 1px solid var(--border) !important;
	}

	.modal-header {
		border-bottom: 1px solid var(--border) !important;
	}
	.form-control {
		border: 1px solid var(--border) !important;
	}

	.modal.fade.show.d-block {
		background: rgba(0, 0, 0, 0.55) !important;
		backdrop-filter: blur(6px);
	}
</style>
