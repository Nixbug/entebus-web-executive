<script lang="ts">
	import DetailHeader from './DetailHeader.svelte';
	import DetailAvatarCard from './DetailAvatarCard.svelte';
	import CustomSelect from './CustomSelect.svelte';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	export let title = 'Executive Details';
	export let data: any = {};
	export let onDelete = () => {};
	export let onSave = (updated: any) => {};
	let isEditing = false;
	let editable = { ...data };

	function handleSave() {
		onSave(editable);
		isEditing = false;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" on:click={() => dispatch('close')}></div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<aside class="sidebar" on:click|stopPropagation>
	<DetailHeader
		{title}
		{isEditing}
		onEdit={() => (isEditing = true)}
		{onDelete}
		onClose={() => dispatch('close')}
	/>

	<div class="content">
		<!-- Avatar Card -->
		<DetailAvatarCard {editable} {isEditing} />
		<!-- CONTACT INFO -->
		<section class="section">
			<h4>CONTACT INFORMATION</h4>
			<div class="section-card">
				<!-- Email -->
				<div class="row">
					<div class="icon email"><i class="bi bi-envelope"></i></div>
					<div class="info">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label>EMAIL ADDRESS</label>
						{#if isEditing}
							<input bind:value={editable.email} />
						{:else}
							<p>{editable.email}</p>
						{/if}
					</div>
				</div>
				<div class="divider"></div>

				<!-- Phone -->
				<div class="row">
					<div class="icon phone"><i class="bi bi-telephone"></i></div>
					<div class="info">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label>PHONE NUMBER</label>
						{#if isEditing}
							<input bind:value={editable.phone} />
						{:else}
							<p>{editable.phone}</p>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<!-- EMPLOYEE DETAILS -->
		<section class="section">
			<h4>EMPLOYEE DETAILS</h4>
			<div class="section-card">
				<!-- ID -->
				<div class="row">
					<div class="icon id"><i class="bi bi-hash"></i></div>
					<div class="info">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label>EMPLOYEE ID</label>
						<p>{editable.id}</p>
					</div>
				</div>
				<div class="divider"></div>
				<!-- fullname -->
				<div class="row">
					<div class="icon person"><i class="bi bi-person"></i></div>
					<div class="info">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label>Full Name</label>
						{#if isEditing}
							<input bind:value={editable.name} />
						{:else}
							<p>{editable.name}</p>
						{/if}
					</div>
				</div>
				<div class="divider"></div>

				<!-- Gender -->
				<div class="row">
					<div class="icon gender"><i class="bi bi-gender-ambiguous"></i></div>
					<div class="info">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label>GENDER</label>
						{#if isEditing}
							<CustomSelect
								label="Gender"
								value={editable.gender}
								options={['Male', 'Female', 'Transgender', 'Other']}
								onChange={(v) => (editable.gender = v)}
							/>
						{:else}
							<p>{editable.gender}</p>
						{/if}
					</div>
				</div>
				<div class="divider"></div>

				<!-- Designation -->
				<div class="row">
					<div class="icon designation"><i class="bi bi-briefcase"></i></div>
					<div class="info">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label>DESIGNATION</label>
						{#if isEditing}
							<input bind:value={editable.designation} />
						{:else}
							<p>{editable.designation}</p>
						{/if}
					</div>
				</div>
				<div class="divider"></div>

				<div class="divider"></div>

				<!-- Created At -->
				<div class="row">
					<div class="icon date"><i class="bi bi-calendar3"></i></div>
					<div class="info">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label>CREATED AT</label>
						<p>{editable.createdAt}</p>
					</div>
				</div>
			</div>
		</section>

		{#if isEditing}
			<div class="footer">
				<button
					class="cancel"
					on:click={() => {
						isEditing = false;
						editable = { ...data };
					}}>Cancel</button
				>
				<button class="save" on:click={handleSave}>Save Changes</button>
			</div>
		{/if}
	</div>
</aside>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		z-index: 5000;
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

	@keyframes slideIn {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
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
		background: var(--bg-primary);
		border: 1px solid var(--border);
		color: var(--text-primary);
		font-size: 15px;
		font-weight: 500;
		padding: 10px 12px;
		border-radius: 10px;
		width: 100%;
		backdrop-filter: blur(10px);
		transition: all 0.2s ease;
	}

	input:focus {
		outline: none;
		border: 2px solid var(--field-border) !important;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
		background: var(--bg-primary);
	}

	.footer {
		display: flex;
		justify-content: center;
		margin-top: 40px;
		padding-top: 24px;
		border-top: 1px solid var(--border);
	}

	.save {
		background: linear-gradient(135deg, #1d4ed8, #3b82f6);
		color: white;
		padding: 12px 24px;
		border-radius: 12px;
		border: none;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.save:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 25px rgba(29, 78, 216, 0.4);
	}

	.cancel {
		background: transparent;
		border: 1px solid var(--border);
		color: #777;
		padding: 12px 20px;
		border-radius: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: #667eea;
		color: #667eea;
	}

	/* Base icon container */
	.icon {
		width: 42px;
		height: 42px;
		border-radius: 14px; /* softer rounded */
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.1rem;
		color: white;
		flex-shrink: 0;
	}

	/* Email Icon */
	.icon.email {
		background: rgba(34, 150, 243, 0.15);
		color: #2296f3;
	}

	/* Phone Icon */
	.icon.phone {
		background: rgba(0, 180, 80, 0.15);
		color: #00b450;
	}

	/* Employee ID */
	.icon.id {
		background: rgba(113, 33, 247, 0.18);
		color: #a56bfd;
	}

	/* Briefcase / Designation */
	.icon.designation {
		background: rgba(255, 140, 0, 0.15);
		color: #ff8c00;
	}

	/* Gender */
	.icon.gender {
		background: rgba(219, 39, 119, 0.18);
		color: #db2777;
	}

	/* Date / Created At */
	.icon.date {
		background: rgba(59, 130, 246, 0.18);
		color: #3b82f6;
	}
	.icon.person {
		background: rgba(59, 130, 246, 0.18);
		color: #362adf;
	}
</style>
