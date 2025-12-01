<script lang="ts">
	import DetailHeader from './DetailHeader.svelte';
	import DetailAvatarCard from './DetailAvatarCard.svelte';
	import CustomSelect from './CustomSelect.svelte';
	import DeleteConfirmationModal from './DeleteConfirmationModal.svelte';
	import { createEventDispatcher } from 'svelte';
	import { onMount, onDestroy } from 'svelte';
	import type { DetailConfig, DetailField } from '$lib/types/detail-config';

	onMount(() => {
		document.body.style.overflow = 'hidden';
	});

	onDestroy(() => {
		document.body.style.overflow = '';
	});

	const dispatch = createEventDispatcher();

	export let config: DetailConfig;
	export let data: any = {};
	export let onDelete = () => {};
	export let onSave = (updated: any) => {};

	let isEditing = false;
	let editable = { ...data };
	let isMobile = false;
	let isClosing = false;
	let showDeleteModal = false;

	onMount(() => {
		isMobile = window.innerWidth <= 768;
	});

	function handleSave() {
		onSave(editable);
		isEditing = false;
	}

	async function closeSidebar() {
		if (isMobile) {
			dispatch('close');
			return;
		}

		isClosing = true;
		await new Promise((res) => setTimeout(res, 300));
		dispatch('close');
	}

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

	//-- Helper to get field value --
	function getFieldValue(field: DetailField) {
		if (field.key.includes('.')) {
			return field.key.split('.').reduce((obj, key) => obj?.[key], editable);
		}
		return editable[field.key];
	}

	//-- Helper to set field value --
	function setFieldValue(field: DetailField, value: any) {
		if (field.key.includes('.')) {
			const keys = field.key.split('.');
			let obj = editable;
			for (let i = 0; i < keys.length - 1; i++) {
				if (!obj[keys[i]]) obj[keys[i]] = {};
				obj = obj[keys[i]];
			}
			obj[keys[keys.length - 1]] = value;
		} else {
			editable[field.key] = value;
		}
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

<button class="overlay" on:click={closeSidebar} aria-label="Close dialog"></button>

<aside class="{isMobile ? 'mobile-page' : 'sidebar'} {isClosing ? 'closing' : ''}">
	<DetailHeader
		title={config.title}
		{isEditing}
		onEdit={() => (isEditing = true)}
		onDelete={handleDeleteClick}
		onClose={closeSidebar}
		actions={config.actions}
	/>

	<div class="content">
		<!-- Avatar Card -->
		<DetailAvatarCard editable={avatarData} />

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
								<label for={field.key}>{field.label}</label>

								{#if isEditing && field.editable !== false}
									{#if field.type === 'select'}
										<CustomSelect
											label={field.label}
											value={getFieldValue(field)}
											options={field.options || []}
											on:change={(e) => setFieldValue(field, e.detail.value)}
										/>
									{:else if field.type === 'date'}
										<input
											type="date"
											value={getFieldValue(field)}
											on:input={(e) => setFieldValue(field, (e.target as HTMLInputElement)?.value)}
										/>
									{:else if field.renderer}
										<svelte:component
											this={field.renderer}
											value={getFieldValue(field)}
											on:change={(e:any) => setFieldValue(field, e.detail)}
										/>
									{:else}
										<input
											type={field.type || 'text'}
											value={getFieldValue(field)}
											on:input={(e) => setFieldValue(field, (e.target as HTMLInputElement)?.value)}
										/>
									{/if}
								{:else if field.renderer && !isEditing}
									<svelte:component this={field.renderer} value={getFieldValue(field)} />
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
					<button
						class="btn save-btn d-flex align-items-center justify-content-center gap-2"
						on:click={handleSave}
					>
						<i class="bi bi-check-lg"></i>
						Save Changes
					</button>
				</div>
			</div>
		{/if}
	</div>
</aside>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<DeleteConfirmationModal
		employeeId={data.id}
		employeeName={data.name}
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
		}

		.button-container .btn {
			width: 100%;
		}
	}

	.button-container .btn {
		flex: 1;
		min-width: 0;
		height: 48px;
	}

	.save-btn {
		background: #2563ff;
		color: #fff;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.95rem;
		border: none;
		transition:
			opacity 0.15s ease,
			transform 0.1s ease;
		cursor: pointer;
	}

	.save-btn:hover {
		opacity: 0.95;
		transform: translateY(-1px);
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
</style>
