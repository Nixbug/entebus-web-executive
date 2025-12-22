<script lang="ts">
	import DetailHeader from './DetailHeader.svelte';
	import DetailAvatarCard from './DetailAvatarCard.svelte';
	import CustomSelect from './CustomSelect.svelte';
	import DeleteConfirmationModal from './DeleteConfirmationModal.svelte';
	import { MOBILE_BREAKPOINT } from '$lib/constants';
	import { createEventDispatcher } from 'svelte';
	import { onMount, onDestroy } from 'svelte';
	import type { DetailConfig, DetailField } from '$lib/types/detail-config';

	//-- Update isMobile on resize --
	function updateIsMobile() {
		isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
	}

	//-- Keep isMobile in sync on resize --
	onMount(() => {
		document.body.style.overflow = 'hidden';
		updateIsMobile();
		window.addEventListener('resize', updateIsMobile);
	});

	//-- Cleanup on destroy --
	onDestroy(() => {
		document.body.style.overflow = '';
		window.removeEventListener('resize', updateIsMobile);
	});

	const dispatch = createEventDispatcher();

	//-- A minimal, flexible shape for sidebar data --
	type DetailEntity = Record<string, unknown> & { id?: string; name?: string };

	export let config: DetailConfig;
	export let data: DetailEntity = {};
	export let onDelete = () => {};
	export let onSave = (updated: DetailEntity) => {};

	let isEditing = false;
	let editable: DetailEntity = { ...data };
	let isMobile = false;
	let isClosing = false;
	let showDeleteModal = false;

	//-- Precompute field keys for fast existence checks
	let fieldKeys: Set<string> = new Set();
	$: fieldKeys = new Set(
		config.sections.flatMap((section) => section.fields.map((field) => field.key))
	);

	//-- Validation state --
	let errors: Record<string, string> = {};
	let isSubmitting = false;

	//-- Validate a single field --
	function validateField(field: DetailField, value: any): string | null {
		const stringValue = value?.toString() || '';
		const trimmedValue = stringValue.trim();
		if (field.required && trimmedValue === '') {
			return `${field.label} is required`;
		}

		return null;
	}

	//-- Check if a field exists in the config --
	function fieldExistsInConfig(fieldKey: string): boolean {
		return fieldKeys.has(fieldKey);
	}

	//-- Validate all fields --
	function validateAllFields(): boolean {
		errors = {};

		if (!config.validationSchema || !config.prepareForValidation) {
			return true;
		}

		const result = config.validationSchema.safeParse(config.prepareForValidation(editable));

		if (!result.success) {
			const fieldErrors = result.error.flatten().fieldErrors;

			//-- Map Zod errors to our field errors --
			Object.entries(fieldErrors).forEach(([schemaField, messages]) => {
				if (Array.isArray(messages) && messages.length > 0) {
					//-- Find which detail field this corresponds to --
					let detailFieldKey = schemaField;

					if (config.validationMapping) {
						//-- Reverse lookup --
						for (const [detailKey, schemaKey] of Object.entries(config.validationMapping)) {
							if (schemaKey === schemaField) {
								detailFieldKey = detailKey;
								break;
							}
						}
					}

					if (fieldExistsInConfig(detailFieldKey)) {
						errors[detailFieldKey] = messages[0];
					}
				}
			});

			return false;
		}

		return true;
	}

	//-- Handle field blur for validation --
	function onFieldBlur(field: DetailField) {
		if (!isEditing) return;
		delete errors[field.key];
		const value = getFieldValue(field);
		const error = validateField(field, value);
		if (error) {
			errors[field.key] = error;
		}

		errors = { ...errors };
	}

	//-- Get field value, supporting nested keys --
	function getFieldValue(field: DetailField): unknown {
		if (field.key.includes('.')) {
			return field.key.split('.').reduce<unknown>((obj, key) => {
				const current = obj as Record<string, unknown> | undefined;
				return current ? current[key] : undefined;
			}, editable);
		}
		return editable[field.key] ?? '';
	}

	//-- Phone input handler: digits-only, capped at 10 (to match CreationForm) --
	function onInputPhone(e: Event, fieldKey: string) {
		const input = e.currentTarget as HTMLInputElement;
		input.value = input.value.replace(/[^\d]/g, '').slice(0, 10);
		editable[fieldKey] = input.value;
	}

	//-- footer functions --
	function handleSave() {
		if (isSubmitting) return;

		isSubmitting = true;

		const isValid = validateAllFields();

		if (isValid) {
			onSave(editable);
			isEditing = false;
			errors = {};
		}

		isSubmitting = false;
	}

	function handleCancel() {
		isEditing = false;
		editable = { ...data };
		errors = {};
	}

	//-- Close sidebar --
	async function closeSidebar() {
		if (isMobile) {
			dispatch('close');
			return;
		}

		isClosing = true;
		await new Promise((res) => setTimeout(res, 300));
		dispatch('close');
	}

	//-- Delete Modal functions--
	function handleDeleteClick() {
		showDeleteModal = true;
	}

	function handleDeleteConfirm() {
		onDelete();
		showDeleteModal = false;
		closeSidebar();
	}

	function handleDeleteCancel() {
		showDeleteModal = false;
	}

	//-- Get avatar data from config --
	const avatarData = {
		initials: config.avatar.initials,
		color: config.avatar.color,
		name: config.avatar.name,
		designation: config.avatar.designation,
		isYou: config.avatar.isYou,
		isActive: config.avatar.isActive,
		statusText: config.avatar.statusText
	};
</script>

<!-- Overlay -->
<button class="overlay" on:click={closeSidebar} aria-label="Close dialog"></button>

<aside class="{isMobile ? 'mobile-page' : 'sidebar'} {isClosing ? 'closing' : ''}">
	<DetailHeader
		title={config.title}
		{isEditing}
		onEdit={() => {
			isEditing = true;
			errors = {};
		}}
		onDelete={handleDeleteClick}
		onClose={isMobile && isEditing ? handleCancel : closeSidebar}
		actions={config.actions}
		onBack={closeSidebar}
	/>

	<div class="content">
		<DetailAvatarCard avatar={avatarData} />

		<!-- Dynamic Sections -->
		{#each config.sections as section}
			<section class="section">
				<h4>{section.title}</h4>
				<div class="section-card">
					{#each section.fields as field, index}
						<div class="row">
							{#if field.icon}
								<div
									class="icon"
									style="background: {field.iconBg ||
										'rgba(59, 130, 246, 0.18)'}; color: {field.iconColor || '#3b82f6'}"
								>
									<i class={field.icon}></i>
								</div>
							{:else}
								<div class="icon placeholder"></div>
							{/if}

							<div class="info">
								<label
									id={`${field.key}-label`}
									for={field.type !== 'select' && !field.renderer ? field.key : undefined}
								>
									{field.label}
									{#if field.editable !== false && field.required && isEditing}
										<span class="text-danger"> *</span>
									{/if}
								</label>

								{#if isEditing && field.editable !== false}
									<div class="input-wrapper">
										{#if field.type === 'select'}
											<CustomSelect
												label={field.label}
												bind:value={editable[field.key] as string}
												options={field.options || []}
												on:change={() => onFieldBlur(field)}
											/>
										{:else if field.type === 'date'}
											<input
												id={field.key}
												type="date"
												bind:value={editable[field.key] as string}
												on:blur={() => onFieldBlur(field)}
												class:is-invalid={errors[field.key]}
											/>
										{:else if field.type === 'phone'}
											<input
												id={field.key}
												type="tel"
												bind:value={editable[field.key] as string}
												on:blur={() => onFieldBlur(field)}
												class:is-invalid={errors[field.key]}
												inputmode="numeric"
												maxlength={10}
												pattern="[0-9]{10}"
												aria-label="Phone number without country code"
												on:input={(e) => onInputPhone(e, field.key)}
											/>
										{:else if field.renderer}
											<svelte:component
												this={field.renderer}
												bind:value={editable[field.key]}
												on:change={() => onFieldBlur(field)}
											/>
										{:else}
											<!-- svelte-ignore a11y-autofocus -->
											<input
												id={field.key}
												type={field.type || 'text'}
												bind:value={editable[field.key] as string}
												on:blur={() => onFieldBlur(field)}
												class:is-invalid={errors[field.key]}
												autofocus={field.autoFocus}
											/>
										{/if}

										{#if errors[field.key]}
											<div class="invalid-feedback d-block">
												{errors[field.key]}
											</div>
										{/if}
									</div>
								{:else}
									<p>{getFieldValue(field) || '-'}</p>
								{/if}
							</div>
						</div>
						{#if index < section.fields.length - 1}
							<div class="divider"></div>
						{/if}
					{/each}
				</div>
			</section>
		{/each}

		{#if isEditing}
			<div class="footer">
				<div class="button-container">
					{#if !isMobile}
						<button
							class="btn cancel-btn d-flex align-items-center justify-content-center gap-2"
							on:click={handleCancel}
							disabled={isSubmitting}
						>
							<i class="bi bi-x-lg"></i>
							Cancel
						</button>
					{/if}

					<button
						class="btn save-btn d-flex align-items-center justify-content-center gap-2 {isMobile
							? 'mobile-full'
							: ''}"
						on:click={handleSave}
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<i class="bi bi-arrow-clockwise spinner"></i>
							Saving...
						{:else}
							{#if !isMobile}<i class="bi bi-check-lg"></i>{/if}
							Save Changes
						{/if}
					</button>
				</div>
			</div>
		{/if}
	</div>
</aside>

{#if showDeleteModal}
	<DeleteConfirmationModal
		id={data.id ?? ''}
		name={data.name ?? ''}
		onConfirm={handleDeleteConfirm}
		onCancel={handleDeleteCancel}
	/>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.527);
		backdrop-filter: blur(9px);
		z-index: 5000;
		border: none;
		width: 100%;
		height: 100%;
	}

	.sidebar {
		position: fixed;
		right: 0;
		top: 0;
		width: 420px;
		height: 100%;
		background: var(--bg-primary);
		display: flex;
		flex-direction: column;
		box-shadow: -4px 0 20px rgba(0, 0, 0, 0.12);
		animation: slideIn 0.3s ease-out;
		overflow-y: auto;
		z-index: 5001;
	}

	.mobile-page {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		background: var(--bg-primary);
		overflow-y: auto;
		z-index: 5001;
		box-shadow: none;
	}

	.sidebar.closing {
		animation: slideOut 0.3s ease-in forwards;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	@keyframes slideOut {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(100%);
		}
	}

	.content {
		padding: 24px;
		flex: 1;
	}

	.section {
		margin-top: 30px;
	}

	.section h4 {
		font-size: 12px;
		font-weight: 700;
		color: var(--text-muted);
		margin-bottom: 10px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.section-card {
		background: var(--bg-card);
		border-radius: 16px;
		overflow: hidden;
		border: 1px solid var(--border);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.row {
		display: flex;
		align-items: center;
		padding: 18px 20px;
		gap: 16px;
	}

	.divider {
		height: 0.1px;
		background-color: var(--border);
		margin: 0 20px;
	}

	.info {
		flex: 1;
	}

	.info label {
		display: block;
		font-size: 12px;
		color: var(--text-muted);
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	.info p {
		margin: 0;
		font-size: 15px;
		font-weight: 500;
		color: var(--text-primary);
	}

	input {
		background: var(--bg-card);
		border: 1px solid var(--border);
		color: var(--text-primary);
		font-size: 15px;
		font-weight: 500;
		padding: 10px 12px;
		border-radius: 10px;
		width: 100%;
		backdrop-filter: blur(10px);
		transition: all 0.2s ease;
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border: 2px solid var(--field-border) !important;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
		background: var(--bg-primary);
	}

	.footer {
		position: sticky;
		bottom: 0;
		background: var(--bg-primary);
		padding: 15px 10px;
		margin-top: 20px;
		border-top: 1px solid var(--border);
		z-index: 5;
	}

	.button-container {
		display: flex;
		gap: 12px;
		justify-content: center;
		align-items: center;
		max-width: 500px;
		margin: 0 auto;
	}

	@media (max-width: 768px) {
		.button-container {
			flex-direction: column;
			width: 100%;
			gap: 8px;
		}

		.button-container .btn {
			width: 100%;
			margin: 0;
		}
		.footer {
			padding: 12px 15px;
		}
	}
	.save-btn.mobile-full {
		width: 100% !important;
		flex: 1 1 auto !important;
	}

	.cancel-btn {
		background: var(--bg-card);
		color: var(--text-primary);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 14px;
		height: 48px;
		font-weight: 500;
		font-size: 0.95rem;
		transition:
			background 0.15s ease,
			border 0.15s ease;
		flex: 1;
	}

	.cancel-btn:hover {
		background: var(--bg-primary);
		border-color: var(--border);
	}

	.save-btn {
		background: var(--edit-btn);
		color: #fff;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.95rem;
		border: none;
		transition:
			opacity 0.15s ease,
			transform 0.1s ease;
		cursor: pointer;
		flex: 1;
		height: 48px;
	}

	.save-btn:hover {
		opacity: 0.95;
		transform: translateY(-1px);
	}

	@media (max-width: 768px) {
		.save-btn {
			width: 100%;
			min-width: 100%;
		}

		.cancel-btn {
			width: 100%;
			min-width: 100%;
		}
	}

	.icon {
		width: 42px;
		height: 42px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.1rem;
		color: white;
		flex-shrink: 0;
	}

	.icon.placeholder {
		background: rgba(255, 255, 255, 0.05);
		visibility: hidden;
	}
	.input-wrapper {
		position: relative;
		width: 100%;
	}

	.is-invalid {
		border-color: var(--delete-btn) !important;
		background: rgba(220, 53, 69, 0.05);
	}

	.is-invalid:focus {
		border-color: var(--delete-btn) !important;
		box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
	}

	.invalid-feedback {
		color: var(--delete-btn);
		font-size: 0.75rem;
		margin-top: 4px;
		font-weight: 500;
		display: block !important;
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.save-btn:disabled,
	.cancel-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.form-control {
		background: var(--bg-card) !important;
		color: var(--text-primary) !important;
		border: 1px solid var(--border) !important;
		height: 48px !important;
		border-radius: 8px !important;
		padding: 10px 12px !important;
		width: 100%;
		box-sizing: border-box;
	}

	.form-control:focus {
		border: 2px solid var(--field-border) !important;
		box-shadow: 0 0 0 3px rgba(var(--field-border-rgb), 0.2) !important;
		outline: none !important;
	}
</style>
