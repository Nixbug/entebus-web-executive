<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import CustomSelect from './CustomSelect.svelte';
	import SearchableDropdown from './SearchableDropdown.svelte';
	import { MOBILE_BREAKPOINT } from '$lib/constants';
	import { browser } from '$app/environment';

	export let fields: {
		name: string;
		label: string;
		placeholder?: string;
		type?: string;
		options?: string[];
		searchableOptions?: boolean;
		loadOptions?:
			| ((
					q?: string,
					limit?: number,
					offset?: number
			  ) => Promise<Array<{ id: number; name: string }>>)
			| null;
		fullWidth?: boolean;
		required?: boolean;
		readonly?: boolean;
		disabled?: boolean;
		disabledMessage?: string;
	}[] = [];

	export let values: Record<string, string> = {};
	export let title = 'Add New Executive';
	export let titleIcon = 'bi-plus-lg';
	export let submitText = 'Create';
	export let open = false;
	export let schema: any = null;
	export let isSubmitting: boolean = false;
	export let optionLoader:
		| ((
				q?: string,
				limit?: number,
				offset?: number
		  ) => Promise<Array<{ id: number; name: string }>>)
		| null = null;

	let showPassword = false;
	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}
	//-- Responsive Handling --
	let isMobile = false;
	function checkMobile() {
		if (!browser) return;
		isMobile = window.innerWidth < MOBILE_BREAKPOINT;
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
			unlockBodyScroll();
		};
	});

	const dispatch = createEventDispatcher();

	//-- Form Handling --
	function getFieldId(name: string) {
		return `field-${String(name).replace(/\s+/g, '-').toLowerCase()}`;
	}

	let formData: Record<string, string> = {};
	let errors: Record<string, string> = {};

	let isScrollLocked = false;

	function lockBodyScroll() {
		if (!browser || isScrollLocked) return;
		document.body.style.overflow = 'hidden';
		isScrollLocked = true;
	}

	function unlockBodyScroll() {
		if (!browser || !isScrollLocked) return;
		document.body.style.overflow = '';
		isScrollLocked = false;
	}

	$: {
		if (open) {
			lockBodyScroll();
		} else {
			unlockBodyScroll();
		}
	}

	//-- Shared phone input handler to avoid duplication --
	function onInputPhone(e: Event, fieldName: string) {
		const input = e.currentTarget as HTMLInputElement;
		input.value = input.value.replace(/[^\d]/g, '').slice(0, 10);
		formData[fieldName] = input.value;
		validateField(fieldName);
	}

	//-- When the form opens, initialize formData with values or empty string --
	$: if (open) {
		formData = fields.reduce(
			(acc, field) => {
				acc[field.name] = values && values[field.name] !== undefined ? values[field.name] : '';
				return acc;
			},
			{} as Record<string, string>
		);
		errors = {};
		showPassword = false;
	}

	//-- Field Validation and Error Handling  --
	function validateFieldWithSchema(fieldName: string) {
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

	function validateFieldWithoutSchema() {
		let hasError = false;
		fields.forEach((field) => {
			if (field.required && !formData[field.name]?.trim()) {
				errors[field.name] = `${field.label} is required`;
				hasError = true;
			}
		});
		return hasError;
	}

	function validateField(fieldName: string) {
		if (!schema) return;
		validateFieldWithSchema(fieldName);
	}

	//-- Clear error for a single field (used on input to remove stale errors while typing) --
	function clearFieldError(fieldName: string) {
		delete errors[fieldName];
		errors = errors;
	}

	//-- Form Submission --
	function handleSubmit() {
		if (isSubmitting) return;
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
			if (validateFieldWithoutSchema()) return;
		}

		dispatch('submit', { ...formData });
	}

	//-- Dialog Handling --
	function close() {
		if (isSubmitting) return;
		open = false;
		dispatch('close');
	}

	//-- Close only when clicking the backdrop itself, not inner content --
	function handleBackdropClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const current = e.currentTarget as HTMLElement;
		if (target === current) {
			close();
		}
	}

	//-- Check if field is full width --
	function isFullWidth(field: any, index: number) {
		return field.fullWidth;
	}
</script>

{#if open}
	{#if !isMobile}
		<!-- Desktop Modal -->
		<div
			class="modal fade show d-block"
			tabindex="0"
			role="dialog"
			on:click={handleBackdropClick}
			on:keydown={(e) => {
				if (e.key === ' ' || e.key === 'Spacebar') {
					e.preventDefault();
					handleBackdropClick(e as unknown as MouseEvent);
				}
			}}
			style="z-index: 1065;"
		>
			<div class="modal-dialog modal-dialog-centered" style="z-index: 1075;">
				<div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation role="none">
					<form on:submit|preventDefault={handleSubmit}>
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
											<div class="dropdown-container">
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
										{:else if field.searchableOptions}
											<div class="dropdown-container">
												<SearchableDropdown
													placeholder={field.placeholder || 'Select item...'}
													value={formData[field.name]}
													onChange={(v: string) => (formData[field.name] = v)}
													loadOptions={field.loadOptions || optionLoader}
													disabled={field.disabled ?? false}
													disabledMessage={field.disabledMessage ?? 'You do not have permission'}
												/>
											</div>
										{:else if field.name === 'phone'}
											<div class="prefix-wrap {formData[field.name]?.length ? 'show-prefix' : ''}">
												<span class="inline-prefix">+91</span>
												<input
													id={getFieldId(field.name)}
													type="text"
													inputmode="numeric"
													maxlength={10}
													on:input={(e) => onInputPhone(e, field.name)}
													class="form-control with-prefix {errors[field.name] ? 'is-invalid' : ''}"
													bind:value={formData[field.name]}
													placeholder={field.placeholder}
													aria-label="Phone number without country code"
												/>
											</div>
										{:else if field.name === 'password'}
											<div class="password-wrap">
												<input
													id={getFieldId(field.name)}
													type={showPassword ? 'text' : 'password'}
													on:input={() => clearFieldError(field.name)}
													on:blur={() => validateField(field.name)}
													on:change={() => validateField(field.name)}
													class="form-control with-toggle {errors[field.name] ? 'is-invalid' : ''}"
													bind:value={formData[field.name]}
													placeholder={field.placeholder}
													readonly={field.readonly}
												/>
												<button
													type="button"
													class="password-toggle"
													on:click={togglePasswordVisibility}
													aria-label={showPassword ? 'Hide password' : 'Show password'}
												>
													<i class={showPassword ? 'bi bi-eye' : 'bi bi-eye-slash'}></i>
												</button>
											</div>
										{:else}
											<input
												id={getFieldId(field.name)}
												type={field.type || 'text'}
												on:input={() => clearFieldError(field.name)}
												on:blur={() => validateField(field.name)}
												on:change={() => validateField(field.name)}
												class="form-control {errors[field.name] ? 'is-invalid' : ''}"
												bind:value={formData[field.name]}
												placeholder={field.placeholder}
												readonly={field.readonly}
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
								disabled={isSubmitting}
							>
								<i class="bi bi-x-lg me-2"></i>
								Cancel
							</button>
							<button
								type="submit"
								class="btn btn-primary flex-fill d-flex justify-content-center"
								aria-label={submitText}
								disabled={isSubmitting}
							>
								{#if isSubmitting}
									<span
										class="spinner-border spinner-border-sm me-2"
										role="status"
										aria-hidden="true"
									></span>
								{:else}
									<i class="bi bi-check-lg me-2"></i>
								{/if}
								{submitText}
							</button>
						</div>
					</form>
				</div>
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
								{:else if field.name === 'phone'}
									<div class="prefix-wrap {formData[field.name]?.length ? 'show-prefix' : ''}">
										<span class="inline-prefix">+91</span>
										<input
											id={getFieldId(field.name)}
											type="text"
											inputmode="numeric"
											maxlength={10}
											on:input={(e) => onInputPhone(e, field.name)}
											class="form-control with-prefix {errors[field.name] ? 'is-invalid' : ''}"
											bind:value={formData[field.name]}
											placeholder={field.placeholder}
											aria-label="Phone number without country code"
										/>
									</div>
								{:else if field.name === 'password'}
									<div class="password-wrap">
										<input
											id={getFieldId(field.name)}
											type={showPassword ? 'text' : 'password'}
											on:input={() => clearFieldError(field.name)}
											on:blur={() => validateField(field.name)}
											on:change={() => validateField(field.name)}
											class="form-control with-toggle {errors[field.name] ? 'is-invalid' : ''}"
											bind:value={formData[field.name]}
											placeholder={field.placeholder}
											readonly={field.readonly}
										/>
										<button
											type="button"
											class="password-toggle"
											on:click={togglePasswordVisibility}
											aria-label={showPassword ? 'Hide password' : 'Show password'}
										>
											<i class={showPassword ? 'bi bi-eye' : 'bi bi-eye-slash'}></i>
										</button>
									</div>
								{:else}
									<input
										id={getFieldId(field.name)}
										type={field.type || 'text'}
										on:input={() => clearFieldError(field.name)}
										on:blur={() => validateField(field.name)}
										on:change={() => validateField(field.name)}
										class="form-control {errors[field.name] ? 'is-invalid' : ''}"
										bind:value={formData[field.name]}
										placeholder={field.placeholder}
										readonly={field.readonly}
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
						<button
							type="submit"
							class="btn btn-primary d-flex justify-content-center gap-2"
							disabled={isSubmitting}
						>
							{#if isSubmitting}
								<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"
								></span>
							{:else}
								<span class="me-2"></span>
							{/if}
							{submitText}
						</button>

						<button type="button" class="btn cancel-btn" on:click={close} disabled={isSubmitting}>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
{/if}

<!-- Styles -->
<style>
	.prefix-wrap {
		position: relative;
	}
	.inline-prefix {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-primary);
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.15s ease;
	}
	.prefix-wrap:focus-within .inline-prefix,
	.prefix-wrap.show-prefix .inline-prefix {
		opacity: 1;
	}
	.form-control.with-prefix {
		padding-left: 12px !important;
	}
	.prefix-wrap:focus-within .form-control.with-prefix,
	.prefix-wrap.show-prefix .form-control.with-prefix {
		padding-left: 48px !important;
	}
	.form-control:focus {
		border: 2px solid var(--field-border) !important;
		box-shadow: 0 0 0 3px rgba(var(--field-border-rgb), 0.2) !important;
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

	.form-control {
		background: var(--bg-card) !important;
		color: var(--text-primary) !important;
		border-radius: 8px !important;
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

	.dropdown-container {
		position: relative;
		z-index: 1;
	}

	/* Password toggle */
	.password-wrap {
		position: relative;
	}
	.form-control.with-toggle {
		padding-right: 44px !important;
	}
	.password-toggle {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		padding: 0;
		color: var(--text-muted);
		cursor: pointer;
		line-height: 1;
	}
	.password-toggle:hover {
		color: var(--text-primary);
	}
</style>
