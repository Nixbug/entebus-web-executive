<script lang="ts">
	import DetailHeader from './DetailHeader.svelte';
	import DetailAvatarCard from './DetailAvatarCard.svelte';
	import MapPreview from './landmark-busstop-components/MapPreview.svelte';
	import CustomSelect from './CustomSelect.svelte';
	import SearchableDropdown from './SearchableDropdown.svelte';
	import DeleteConfirmationModal from './DeleteConfirmationModal.svelte';
	import BusStopsSection from './landmark-busstop-components/BusStopsSection.svelte';
	import { MOBILE_BREAKPOINT } from '$lib/constants';
	import { createEventDispatcher } from 'svelte';
	import { onMount, onDestroy } from 'svelte';
	import type { DetailConfig, DetailField } from '$lib/types/detail-config';
	import type { CreateBusStopRequest } from '$lib/services/bus-stop';

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
	type DeleteHandler = () => boolean | void | Promise<boolean | void>;
	type SaveHandler = (updated: DetailEntity) => boolean | void | Promise<boolean | void>;
	export let onDelete: DeleteHandler = () => {};
	export let onSave: SaveHandler = () => {};
	export let sectionName: string = '';
	export let landmarks: any[] = [];
	export let busStops: any[] = [];
	export let hasDeletePermission: boolean = true;
	export let hasUpdatePermission: boolean = true;
	export let hasBusStopEditPermission: boolean = true;
	export let hasBusStopDeletePermission: boolean = true;
	export let hasBusStopCreatePermission: boolean = true;

	type DeleteBusStopHandler = (
		busStopId: string | number
	) => boolean | void | Promise<boolean | void>;
	export let onDeleteBusStop: DeleteBusStopHandler = () => {};

	type CreateBusStopHandler = (
		busStopData: CreateBusStopRequest
	) => boolean | void | Promise<boolean | void>;
	export let onCreateBusStop: CreateBusStopHandler = () => {};

	//-- Normalize date fields to YYYY-MM-DD for <input type="date"> compatibility --
	//-- Uses local timezone to avoid ±1 day shift that toISOString() (UTC) can cause --
	function normalizeDateFields(obj: DetailEntity): DetailEntity {
		const copy = { ...obj };
		for (const section of config.sections) {
			for (const field of section.fields) {
				//-- Only normalize date fields that are editable--
				if (field.type === 'date' && field.editable && copy[field.key]) {
					const d = new Date(copy[field.key] as string);
					if (!isNaN(d.getTime())) {
						const yyyy = d.getFullYear();
						const mm = String(d.getMonth() + 1).padStart(2, '0');
						const dd = String(d.getDate()).padStart(2, '0');
						copy[field.key] = `${yyyy}-${mm}-${dd}`;
					}
				}
			}
		}
		return copy;
	}

	let isEditing = false;
	let editable: DetailEntity = normalizeDateFields({ ...data });
	let isMobile = false;
	let isClosing = false;
	let showDeleteModal = false;
	let isDeleting = false;
	//-- Bus stop location WKT selected from map --
	let busStopLocation: string | null = null;
	//-- ID of bus stop currently being edited (for drag interaction) --
	let editingBusStopId: string | null = null;

	//-- Precompute field keys for fast existence checks --
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

	//-- Check if a visible field exists after the given index --
	function hasNextVisibleField(fields: DetailField[], index: number): boolean {
		for (let i = index + 1; i < fields.length; i++) {
			const f = fields[i];
			const hidden =
				(isEditing && f.visibleWhenEditing === false) ||
				(!isEditing && f.visibleWhenViewing === false);
			if (!hidden) return true;
		}
		return false;
	}

	//-- Phone input handler: digits-only, capped at 10 (to match CreationForm) --
	function onInputPhone(e: Event, fieldKey: string) {
		const input = e.currentTarget as HTMLInputElement;
		input.value = input.value.replace(/[^\d]/g, '').slice(0, 10);
		editable[fieldKey] = input.value;
	}

	//-- footer functions --
	async function handleSave() {
		if (isSubmitting) return;
		isSubmitting = true;
		const isValid = validateAllFields();
		if (isValid) {
			try {
				const saveResult = await onSave(editable);
				if (saveResult !== false) {
					isEditing = false;
					errors = {};
					try {
						//-- Stop interactions but keep the drawn boundary after save --
						mapPreviewRef?.finalizeEditing?.();
					} catch (e) {
						console.error(e);
					}
				}
			} catch (e) {
				console.error(e);
			}
		}
		isSubmitting = false;
	}

	function handleCancel() {
		isEditing = false;
		editable = normalizeDateFields({ ...data });
		errors = {};
		try {
			//-- Ensure any active drawing/modifying in the embedded map is stopped --
			mapPreviewRef?.cancelEditing?.();
		} catch (e) {
			console.error(e);
		}
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
		// -- Await parent's delete handler and keep modal open while deleting --
		(async () => {
			isDeleting = true;
			try {
				const res = await onDelete();
				if (res === false) {
					return;
				}
				showDeleteModal = false;
				closeSidebar();
			} catch (e) {
				console.error(e);
			} finally {
				isDeleting = false;
			}
		})();
	}

	function handleDeleteCancel() {
		showDeleteModal = false;
	}

	//-- Get avatar data from config (optional) --
	const avatarData = config.avatar
		? {
				initials: config.avatar.initials,
				color: config.avatar.color,
				name: config.avatar.name,
				registrationNumber: config.avatar.registrationNumber,
				icon: config.avatar.icon,
				designation: config.avatar.designation,
				isYou: config.avatar.isYou,
				isActive: config.avatar.isActive,
				statusText: config.avatar.statusText,
				dashboardLink: config.avatar.dashboardLink
			}
		: null;

	//-- Embedded map bindings: focus selected landmark and show its boundary --
	//-- Initialize from `data` once; allow map (bound `detailBoundary`) to update this value --
	let detailSelectedLandmarkId: string | null = (data && (data.id as string)) || null;
	let detailBoundary: any = (data && (data.boundary ?? null)) || null;
	//-- Reference to embedded MapPreview component so we can control it from here --
	let mapPreviewRef: any = null;
	//-- Reference to BusStopsSection for updating location when dragged on map --
	let busStopsSectionRef: any = null;
	//-- Keep `detailSelectedLandmarkId` in sync if `data` changes --
	$: detailSelectedLandmarkId = (data && (data.id as string)) || null;

	//-- Keep the editable copy of the boundary in sync with draws from the embedded map. --
	//-- Reassign `editable` so Svelte notices the change and updates the UI immediately. --
	$: if (detailBoundary != null && detailBoundary !== '') {
		editable = { ...editable, boundary: detailBoundary };
	}
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
			for (const section of config.sections) {
				for (const field of section.fields) {
					if (field.type === 'phone') {
						let val = editable[field.key];
						if (typeof val === 'string') {
							//-- Remove non-digit chars, keep last 10 digits or clear if none --
							const digits = val.replace(/\D/g, '');
							if (digits.length > 0) {
								editable[field.key] = digits.slice(-10);
							} else {
								editable[field.key] = '';
							}
						}
					}
				}
			}
			//-- When entering edit mode, if there's an existing boundary, enable modify --
			try {
				mapPreviewRef?.startModify?.();
			} catch (e) {
				console.error(e);
			}
		}}
		onDelete={handleDeleteClick}
		{hasDeletePermission}
		{hasUpdatePermission}
		onClose={isMobile && isEditing ? handleCancel : closeSidebar}
		actions={config.actions}
		onBack={closeSidebar}
	/>

	<div class="content">
		{#if detailBoundary || sectionName === 'landmark' || (landmarks && landmarks.length > 0)}
			<div class="avatar-map">
				<MapPreview
					bind:this={mapPreviewRef}
					landmarks={landmarks && landmarks.length ? landmarks : [data]}
					{busStops}
					bind:boundary={detailBoundary}
					bind:selectedLandmarkId={detailSelectedLandmarkId}
					showDrawingControls={isEditing}
					isSidebarLayout={true}
					{editingBusStopId}
					on:busStopLocationSelected={(e) => {
						busStopLocation = e.detail.location;
					}}
					on:busStopLocationCleared={() => {
						busStopLocation = null;
					}}
					on:busStopLocationUpdated={(e) => {
						dispatch('busStopLocationUpdated', e.detail);
						//-- Update the editable location in BusStopsSection --
						busStopsSectionRef?.updateBusStopLocation?.(e.detail.busStopId, e.detail.location);
					}}
				/>
			</div>
		{:else if avatarData}
			<DetailAvatarCard avatar={avatarData} />
		{/if}

		<!-- Bus Stops Section (for landmarks) -->
		{#if sectionName === 'landmark' && !isEditing}
			<BusStopsSection
				bind:this={busStopsSectionRef}
				{busStops}
				landmarkId={String(data.apiId ?? '')}
				{busStopLocation}
				bind:editingBusStopId
				on:edit={(e) => dispatch('editBusStop', e.detail)}
				{onDeleteBusStop}
				{onCreateBusStop}
				on:created={() => {
					busStopLocation = null;
				}}
				{hasBusStopEditPermission}
				{hasBusStopDeletePermission}
				{hasBusStopCreatePermission}
			/>
		{/if}

		<!-- Dynamic Sections -->
		{#each config.sections as section}
			<section class="section">
				<h4 class="fw-inter-700">{section.title}</h4>
				<div class="section-card">
					{#each section.fields as field, index}
						{#if (isEditing && field.visibleWhenEditing === false) || (!isEditing && field.visibleWhenViewing === false)}
							<!-- Field visibility controlled by config -->
						{:else}
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
										class="fw-inter-600"
										id={`${field.key}-label`}
										for={field.type !== 'select' &&
										field.type !== 'searchableSelect' &&
										!field.renderer
											? field.key
											: undefined}
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
													value={(editable[field.key] as string) || ''}
													options={field.options || []}
													onChange={(v) => {
														editable[field.key] = v;
														onFieldBlur(field);
													}}
												/>
											{:else if field.type === 'date'}
												<input
													class="fw-inter-500"
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
											{:else if field.type === 'searchableSelect'}
												<SearchableDropdown
													value={(editable[field.key] as string) || ''}
													placeholder={field.label}
													loadOptions={field.loadOptions}
													disabled={field.disabled || false}
													ariaLabelledBy={`${field.key}-label`}
													onChange={(v) => {
														editable[field.key] = v;
														onFieldBlur(field);
													}}
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
												<div class="invalid-feedback d-block fw-inter-500">
													{errors[field.key]}
												</div>
											{/if}
										</div>
									{:else}
										<p class="fw-inter-400">{getFieldValue(field) || '-'}</p>
									{/if}
								</div>
							</div>
							{#if hasNextVisibleField(section.fields, index)}
								<div class="divider"></div>
							{/if}
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
							class="btn cancel-btn d-flex align-items-center justify-content-center gap-2 fw-inter-500"
							on:click={handleCancel}
							disabled={isSubmitting}
						>
							<i class="bi bi-x-lg"></i>
							Cancel
						</button>
					{/if}

					<button
						class="btn save-btn btn-primary fw-inter-500 d-flex align-items-center justify-content-center gap-2 {isMobile
							? 'mobile-full'
							: ''}"
						on:click={handleSave}
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<span
								class="spinner"
								style="margin-right:8px; display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; vertical-align:middle;"
							></span> Updating...
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
		{sectionName}
		onConfirm={handleDeleteConfirm}
		onCancel={handleDeleteCancel}
		loading={isDeleting}
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
		color: var(--text-muted);
		margin-bottom: 10px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.section-card {
		background: var(--bg-card);
		border-radius: 16px;
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
	}

	.info p {
		margin: 0;
		font-size: 15px;
		color: var(--text-primary);
	}

	input {
		background: var(--bg-card);
		border: 1px solid var(--border);
		color: var(--text-primary);
		font-size: 15px;
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
		border-radius: 10px;
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
		overflow: visible;
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
</style>
