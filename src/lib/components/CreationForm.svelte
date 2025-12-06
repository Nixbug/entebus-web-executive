<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import CustomSelect from './CustomSelect.svelte';
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
	export let titleIcon = 'bi-plus-lg';
	export let submitText = 'Create';
	export let open = false;
	export let schema: any = null;

	let isMobile = false;

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

	function validateField(fieldName: string) {
		if (!schema) return;

		const result = schema.safeParse(formData);
		if (!result.success) {
			const fieldErrors = result.error.flatten().fieldErrors;
			if (fieldErrors[fieldName] && Array.isArray(fieldErrors[fieldName])) {
				errors[fieldName] = fieldErrors[fieldName][0];
			} else {
				delete errors[fieldName];
			}
		} else {
			delete errors[fieldName];
		}
		errors = errors;
	}

	function handleSubmit() {
		errors = {};
		if (schema) {
			const result = schema.safeParse(formData);
			if (!result.success) {
				const fieldErrors = result.error.flatten().fieldErrors;
				for (const [key, msgs] of Object.entries(fieldErrors)) {
					if (Array.isArray(msgs) && msgs.length > 0) {
						errors[key] = msgs[0];
					}
				}
				return;
			}
		} else {
			let hasError = false;
			fields.forEach((field) => {
				if (field.required && !formData[field.name]?.trim()) {
					errors[field.name] = `${field.label} is required`;
					hasError = true;
				}
			});
			if (hasError) return;
		}
		dispatch('submit', { ...formData });
		close();
	}

	function close() {
		open = false;
		dispatch('close');
	}

	function isFullWidth(field: any, index: number) {
		return field.fullWidth || index === 0;
	}
</script>

{#if open}
	{#if !isMobile}
		<!-- Desktop Modal -->
		<div
			class="modal fade show d-block"
			tabindex="-1"
			role="dialog"
			on:click={close}
			on:keydown={(e) => {
				if (e.key === 'Enter') {
					close();
				}
			}}
			style="z-index: 1040;"
		>
			<div
				class="modal-dialog modal-dialog-centered"
				role="document"
				aria-hidden="true"
				on:click|stopPropagation
				on:keydown={(e) => {
					if (e.key === 'Enter') {
						close();
					}
				}}
				style="z-index: 1050;"
			>
				<form class="modal-content" on:submit|preventDefault={handleSubmit}>
					<div class="modal-header">
						<h5 class="modal-title d-flex align-items-center gap-2">
							<i class={`${titleIcon} text-primary fw-bold`}></i>
							{title}
						</h5>
					</div>

					<div class="modal-body" style="position: relative; z-index: auto;">
						<div class="row g-3 p-3">
							{#each fields as field, i}
								<div class={isFullWidth(field, i) ? 'col-12' : 'col-md-6'}>
									<label class="form-label" for={getFieldId(field.name)}>
										{field.label}
										{#if field.required}<span class="text-danger">*</span>{/if}
									</label>

									{#if field.options}
										<div style="position: relative; z-index: var(--dropdown-z-index, 1060);">
											<CustomSelect
												label={field.label}
												value={formData[field.name]}
												options={field.options}
												onChange={(v) => {
													formData[field.name] = v;
													validateField(field.name);
												}}
											/>
										</div>
									{:else}
										<input
											id={getFieldId(field.name)}
											type={field.name === 'phone' ? 'text' : field.type || 'text'}
											inputmode={field.name === 'phone' ? 'numeric' : undefined}
											pattern={field.name === 'phone' ? '\\d*' : undefined}
											on:input={(e) => {
												if (field.name === 'phone') {
													const input = e.currentTarget as HTMLInputElement;
													input.value = input.value.replace(/[^+\d]/g, '');
												}
												validateField(field.name);
											}}
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

					<div class="modal-footer d-flex gap-2 w-100 px-4">
						<button
							type="button"
							class="btn cancel-btn flex-fill d-flex justify-content-center"
							on:click={close}
						>
							<i class="bi bi-x-lg me-2"></i>
							Cancel
						</button>
						<button type="submit" class="btn btn-primary flex-fill d-flex justify-content-center">
							<i class="bi bi-check-lg me-2"></i>
							{submitText}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if isMobile}
		<!-- Mobile Bottom Sheet -->
		<div
			class="mobile-overlay"
			role="button"
			aria-label="Close dialog"
			tabindex="0"
			on:click={close}
			on:keydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					close();
				}
			}}
		>
			<div
				class="mobile-sheet"
				role="dialog"
				aria-modal="true"
				aria-labelledby="cf-title"
				tabindex="0"
				on:click|stopPropagation
				on:keydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						close();
					}
				}}
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
									<CustomSelect
										label={field.label}
										value={formData[field.name]}
										options={field.options}
										onChange={(v) => {
											formData[field.name] = v;
											validateField(field.name);
										}}
									/>
								{:else}
									<input
										id={getFieldId(field.name)}
										type={field.name === 'phone' ? 'text' : field.type || 'text'}
										inputmode={field.name === 'phone' ? 'numeric' : undefined}
										pattern={field.name === 'phone' ? '\\d*' : undefined}
										on:input={(e) => {
											if (field.name === 'phone') {
												const input = e.currentTarget as HTMLInputElement;
												input.value = input.value.replace(/[^+\d]/g, '');
											}
											validateField(field.name);
										}}
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
	.form-control:focus {
		border: 2px solid var(--field-border) !important;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--field-border) 80%, transparent) !important;
		outline: none !important;
	}
	.mobile-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		display: flex;
		align-items: flex-end;
		z-index: var(--overlay-z-index, 9999);
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
	.form-control {
		background: var(--bg-card) !important;
		color: var(--text-primary) !important;
		border-radius: 8px !important;
		border: 1px solid var(--border-color, #444) !important;
		height: 48px !important;
	}
	.form-control::placeholder {
		color: var(--text-muted) !important;
		opacity: 1;
	}
	.cancel-btn {
		background: var(--bg-card) !important;
		color: var(--text-primary);
		border: 1px solid var(--border) !important;
	}
	.cancel-btn:hover {
		background-color: var(--bg-primary) !important;
	}
	.modal-content {
		border-radius: 12px;
		border: 1px solid var(--border-color, #444);
	}
	.handle {
		background: var(--border);
	}
	.modal-header {
		border-bottom: 1px solid var(--border) !important;
	}
	.modal-footer {
		border-top: none;
	}
	.modal-dialog {
		max-width: 600px !important;
	}

	.modal.fade.show.d-block {
		background: rgba(0, 0, 0, 0.55) !important;
	}
</style>
