<script lang="ts">
	import { onMount } from 'svelte';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import SearchableDropdown from '$lib/components/SearchableDropdown.svelte';
	import {
		getLoggedInUserId,
		getInitials,
		titleCase,
		mapGenderToLabel,
		mapStatusToLabel,
		utcToIstFormat
	} from '$lib/helpers';
	import { getColorFromName } from '$lib/color-palette';
	import { GENDER_VALUE_BY_LABEL } from '$lib/constants';
	import { fetchExecutiveAccount, updateExecutiveAccount } from '$lib/services/executive-account';
	import {
		fetchRoleMap,
		createRoleMap,
		updateRoleMap,
		deleteRoleMap,
		type CreateRoleMapRequest,
		type UpdateRoleMapRequest
	} from '$lib/services/executive-role-map';
	import { fetchExecutiveRoleList } from '$lib/services/executive-role';
	import {
		fetchExecutiveImage,
		fetchExecutiveImageForExecutive,
		deleteExecutiveImage,
		uploadExecutiveImage,
		clearExecutiveImageCache
	} from '$lib/services/executive-image';
	import { handleApiError } from '$lib/utils/api-error';
	import { canUpdateExecutiveRole } from '$lib/utils/permissions';
	import toast from '$lib/utils/toast';
	import { executiveAccountUpdateSchema } from '$lib/schemas';
	interface ProfileData {
		apiId: number;
		id: string;
		name: string;
		username: string;
		designation: string;
		gender: string;
		status: string;
		email: string;
		phone: string;
		isActive: boolean;
		createdAt: string;
		updatedAt: string;
		roleName: string;
		roleId: string;
		roleMapId: number | null;
	}

	let profile: ProfileData | null = null;
	let loading = true;
	let error = '';

	let isSaving = false;
	let showPassword = false;
	let fieldErrors: Record<string, string> = {};

	let editName = '';
	let editDesignation = '';
	let editGender = '';
	let editEmail = '';
	let editPhone = '';
	let editPassword = '';
	let editRoleId = '';

	// ── Profile image state ──
	let profileImageUrl: string | null = null;
	let profileImageLoading = false;
	let avatarFileInput: HTMLInputElement | null = null;

	async function loadProfileImage() {
		if (!profile) return;
		const execId = profile.apiId;
		if (!execId || Number.isNaN(execId)) return;
		profileImageLoading = true;
		try {
			const url = await fetchExecutiveImageForExecutive(execId, { width: 300, height: 300 });
			profileImageUrl = url;
		} catch (err) {
			console.error('loadProfileImage error', err);
		} finally {
			profileImageLoading = false;
		}
	}

	async function handleAvatarFileSelected(file: File) {
		if (!profile) return;
		const execId = profile.apiId;
		if (!execId) return;
		profileImageLoading = true;
		try {
			// -- Delete existing image(s) first --
			try {
				const list = await fetchExecutiveImage({ executive_id: execId });
				const items = Array.isArray(list)
					? list
					: list && (list as any).data
						? (list as any).data
						: [];
				const matchedItems = items.filter((it: any) => Number(it?.executive_id) === execId);
				const itemsMissingId = items.filter(
					(it: any) => it?.executive_id == null || it?.executive_id === ''
				);
				const toDelete =
					matchedItems.length > 0
						? matchedItems
						: items.length === 1 && itemsMissingId.length === 1
							? items
							: [];
				for (const item of toDelete) {
					const imgId = Number(item.id);
					if (imgId && !Number.isNaN(imgId)) {
						try {
							await deleteExecutiveImage(imgId);
						} catch (e) {
							console.warn('Failed to delete existing executive image', e);
						}
					}
				}
				clearExecutiveImageCache(execId);
			} catch (e) {
				console.warn('Failed to check existing images before upload', e);
			}
			// -- Upload new image (company_id is not needed by this endpoint; use 0 as placeholder) --
			await uploadExecutiveImage(file, execId);
			clearExecutiveImageCache(execId);
			await loadProfileImage();
			toast.success('Profile photo updated.');
		} catch (err) {
			const msg = await handleApiError(err);
			const status = (err as any)?.status ?? (err as any)?.response?.status;
			if (status === 406) {
				toast.error('Invalid file format or size. Use JPG/PNG under 10 MB.');
			} else {
				toast.error(msg || 'Failed to upload photo. Please try again.');
			}
			profileImageLoading = false;
		}
	}

	function onAvatarClick() {
		avatarFileInput?.click();
	}

	function onAvatarFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const f = input.files && input.files[0];
		if (!f) return;
		handleAvatarFileSelected(f);
		input.value = '';
	}

	const genderOptions = ['Male', 'Female', 'Transgender', 'Other'];

	function clearFieldError(field: string) {
		delete fieldErrors[field];
		fieldErrors = fieldErrors; // trigger reactivity
	}

	function validatePayload(): boolean {
		fieldErrors = {};

		// Build validation object using schema field names
		const validationData = {
			fullName: editName.trim(),
			designation: editDesignation.trim() || undefined,
			email: editEmail.trim() || undefined,
			phone: phoneDigitsOnly(editPhone) || undefined,
			gender: editGender || undefined,
			password: editPassword.trim() || undefined
		};

		// Map schema field names → HTML display keys
		const schemaToDisplay: Record<string, string> = {
			fullName: 'full_name',
			designation: 'designation',
			email: 'email_id',
			phone: 'phone_number',
			password: 'password'
		};

		const result = executiveAccountUpdateSchema.safeParse(validationData);
		if (!result.success) {
			const flatErrors = result.error.flatten().fieldErrors;
			for (const [schemaKey, messages] of Object.entries(flatErrors)) {
				if (Array.isArray(messages) && messages.length > 0) {
					const displayKey = schemaToDisplay[schemaKey] ?? schemaKey;
					fieldErrors[displayKey] = messages[0];
				}
			}
			fieldErrors = fieldErrors; // trigger reactivity
			return false;
		}
		return true;
	}

	function initEditFields() {
		if (!profile) return;
		editName = profile.name;
		editDesignation = profile.designation;
		editGender = profile.gender;
		editEmail = profile.email;
		editPhone = phoneDigitsOnly(profile.phone);
		editPassword = '';
		editRoleId = profile.roleId;
		showPassword = false;
	}

	function revertField(field: string) {
		if (!profile) return;
		switch (field) {
			case 'name':
				editName = profile.name;
				break;
			case 'designation':
				editDesignation = profile.designation;
				break;
			case 'gender':
				editGender = profile.gender;
				break;
			case 'email':
				editEmail = profile.email;
				break;
			case 'phone':
				editPhone = phoneDigitsOnly(profile.phone);
				break;
			case 'password':
				editPassword = '';
				break;
			case 'role':
				editRoleId = profile.roleId;
				break;
		}
	}

	function formatPhone(phone: string | null | undefined): string {
		if (!phone) return '';
		const digits = String(phone).replace(/\D/g, '');
		const normalized = digits.length > 10 ? digits.slice(-10) : digits;
		if (!normalized) return '';
		return `+91 ${normalized}`;
	}

	function phoneDigitsOnly(phone: string): string {
		const digits = String(phone).replace(/\D/g, '');
		return digits.length > 10 ? digits.slice(-10) : digits;
	}

	async function loadRoleOptions(
		q?: string,
		limit = 10,
		offset = 0
	): Promise<Array<{ id: number; name: string }>> {
		try {
			const result = await fetchExecutiveRoleList({ search: q, limit, offset });
			if (!Array.isArray(result)) return [];
			return result.map((r: any) => ({ id: Number(r.id), name: String(r.name) })).slice(0, limit);
		} catch {
			return [];
		}
	}

	async function loadProfile() {
		loading = true;
		error = '';
		const userId = getLoggedInUserId();
		if (!userId) {
			error = 'Unable to determine logged-in user.';
			loading = false;
			return;
		}
		try {
			const [accountList, roleMapList] = await Promise.all([
				fetchExecutiveAccount({ id: userId, limit: 1 }),
				fetchRoleMap(userId)
			]);
			console.log('Fetched account and role map data', { accountList, roleMapList });
			const item = Array.isArray(accountList) ? accountList[0] : null;
			if (!item) {
				error = 'Profile not found.';
				loading = false;
				return;
			}

			let roleName = '',
				roleId = '',
				roleMapId: number | null = null;
			if (roleMapList && roleMapList.length > 0) {
				const firstMap = roleMapList[0];
				roleMapId = firstMap.id ?? null;
				if (firstMap.role_id != null) {
					roleId = String(firstMap.role_id);
					try {
						const roles = await fetchExecutiveRoleList({ id: firstMap.role_id });
						roleName = roles?.[0]?.name ? titleCase(String(roles[0].name)) : '';
					} catch {
						roleName = '';
					}
				}
			}

			profile = {
				apiId: item.id ?? userId,
				id: item.id ? `EXE-${item.id}` : '',
				name: titleCase(item.full_name ?? item.username ?? ''),
				username: item.username ?? '',
				designation: titleCase(item.designation ?? ''),
				gender: titleCase(mapGenderToLabel(item.gender)),
				status: titleCase(mapStatusToLabel(item.status)),
				email: item.email_id ?? '',
				phone: formatPhone(item.phone_number),
				isActive: item.status === 1,
				createdAt: utcToIstFormat(item.created_on ?? ''),
				updatedAt: utcToIstFormat(item.updated_on ?? ''),
				roleName,
				roleId,
				roleMapId
			};
		} catch (e) {
			error = await handleApiError(e);
		}
		loading = false;
	}

	async function saveProfile() {
		if (!profile) return;
		isSaving = true;
		const payload: Record<string, any> = {};

		if (editName.trim() !== profile.name) payload.full_name = editName.trim() || null;
		if (editDesignation.trim() !== profile.designation)
			payload.designation = editDesignation.trim() || null;
		if (editEmail.trim() !== profile.email) payload.email_id = editEmail.trim() || null;

		const newPhoneDigits = phoneDigitsOnly(editPhone);
		const oldPhoneDigits = phoneDigitsOnly(profile.phone);
		if (newPhoneDigits !== oldPhoneDigits)
			payload.phone_number = newPhoneDigits ? `+91 ${newPhoneDigits}` : null;

		if (editGender !== profile.gender) {
			const gVal = GENDER_VALUE_BY_LABEL[editGender];
			if (gVal !== undefined) payload.gender = gVal;
		}
		const pw = editPassword.trim();
		if (pw) payload.password = pw;

		// Validate all current field values against schema (skip role field)
		if (!validatePayload()) {
			isSaving = false;
			return;
		}

		try {
			await updateExecutiveAccount(profile.apiId, payload);
		} catch (err: any) {
			const msg = await handleApiError(err);
			toast.error(msg || 'Failed to update profile.');
			isSaving = false;
			return;
		}

		const newRoleId = editRoleId ? Number(editRoleId) : null;
		const oldRoleId = profile.roleId ? Number(profile.roleId) : null;
		const roleMapId = profile.roleMapId;

		if (newRoleId !== oldRoleId && canUpdateExecutiveRole()) {
			try {
				if (newRoleId) {
					if (roleMapId)
						await updateRoleMap(roleMapId, { role_id: newRoleId } as UpdateRoleMapRequest);
					else
						await createRoleMap({
							role_id: newRoleId,
							executive_id: profile.apiId
						} as CreateRoleMapRequest);
				} else if (roleMapId) {
					await deleteRoleMap(roleMapId);
				}
			} catch (err: any) {
				const msg = await handleApiError(err);
				toast.warning(msg || 'Profile updated, but role update failed.');
			}
		}

		toast.success('Profile updated successfully.');
		showPassword = false;
		await loadProfile();
		initEditFields();
		isSaving = false;
	}

	onMount(async () => {
		await loadProfile();
		initEditFields();
		await loadProfileImage();
	});

	$: avatarColor = profile?.name ? getColorFromName(profile.name) : '#0d6efd';
	$: initials = profile?.name ? getInitials(null, profile.name) : '?';
	$: canEditRole = canUpdateExecutiveRole();
	$: dirtyName = profile ? editName !== profile.name : false;
	$: dirtyDesig = profile ? editDesignation !== profile.designation : false;
	$: dirtyGender = profile ? editGender !== profile.gender : false;
	$: dirtyEmail = profile ? editEmail !== profile.email : false;
	$: dirtyPhone = profile ? editPhone !== phoneDigitsOnly(profile.phone) : false;
	$: dirtyPassword = editPassword.trim() !== '';
	$: dirtyRole = profile ? editRoleId !== profile.roleId : false;

	let mobileTab: 'card' | 'details' = 'card';
</script>

<div class="page-root">
	<div class="sticky-top">
		<HeaderBar />
	</div>

	<main class="container py-4">
		<HomeButton />

		{#if loading}
			<div class="d-flex justify-content-center align-items-center" style="min-height: 40vh;">
				<div class="spinner-border text-primary" role="status" style="width:2.5rem;height:2.5rem;">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
		{:else if error}
			<div class="alert alert-danger mt-4">{error}</div>
		{:else if profile}
			<!-- Mobile tab toggle (hidden on desktop) -->
			<div class="mobile-tabs">
				<button
					class="mtab {mobileTab === 'card' ? 'mtab-active' : ''}"
					on:click={() => (mobileTab = 'card')}
				>
					<i class="bi bi-id-card"></i> Profile Card
				</button>
				<button
					class="mtab {mobileTab === 'details' ? 'mtab-active' : ''}"
					on:click={() => (mobileTab = 'details')}
				>
					<i class="bi bi-person-lines-fill"></i> Details
				</button>
			</div>

			<div class="profile-layout">
				<!-- ══ SIDEBAR ══ -->
				<aside class="profile-sidebar" class:mobile-hidden={mobileTab !== 'card'}>
					<!-- Identity card -->
					<div class="id-card">
						<div class="id-strip" style="background: {avatarColor};"></div>
						<div class="id-body">
							<div class="avatar-anchor">
								<button
									class="avatar"
									style="background:{avatarColor};"
									type="button"
									aria-label="Profile photo"
								>
									{#if profileImageLoading}
										<div class="avatar-loader"><span class="avatar-dot"></span></div>
									{:else if profileImageUrl}
										<img src={profileImageUrl} alt={profile.name} loading="lazy" decoding="async" />
									{:else}
										{initials}
									{/if}
								</button>
								<button
									class="avatar-pencil-badge"
									type="button"
									on:click={onAvatarClick}
									aria-label="Upload profile photo"
								>
									<i class="bi bi-pencil"></i>
								</button>
								<input
									bind:this={avatarFileInput}
									type="file"
									accept="image/*"
									on:change={onAvatarFileChange}
									style="display:none"
								/>
							</div>

							<h2 class="id-name">
								{profile.name}
								<span class="id-tag"> @{profile.username}</span>
							</h2>

							<!-- Role — shown prominently right under name -->
							{#if profile.roleName}
								<div class="id-role-badge">
									<i class="bi bi-shield-check"></i>
									{profile.roleName}
								</div>
							{:else}
								<div class="id-role-badge id-role-empty">
									<i class="bi bi-shield"></i>
									No role assigned
								</div>
							{/if}

							{#if profile.designation}
								<p class="id-desig">{profile.designation}</p>
							{/if}

							<div class="id-chips">
								<span class="id-tag">{profile.id} </span>
								<span class="status-chip {profile.isActive ? 'chip-on' : 'chip-off'}">
									<span class="chip-dot"></span>{profile.status}
								</span>
							</div>

							<hr class="id-hr" />

							<div class="contact-list">
								<div class="cl-row">
									<span class="cl-icon"><i class="bi bi-envelope"></i></span>
									{#if profile.email}
										<span class="cl-val">{profile.email}</span>
									{:else}
										<span class="cl-val cl-empty">Not added yet</span>
									{/if}
								</div>
								<div class="cl-row">
									<span class="cl-icon"><i class="bi bi-telephone"></i></span>
									{#if profile.phone}
										<span class="cl-val mono">{profile.phone}</span>
									{:else}
										<span class="cl-val cl-empty">Not added yet</span>
									{/if}
								</div>
							</div>

							<hr class="id-hr" />

							<div class="act-list">
								<div class="act-row">
									<span class="act-label"><i class="bi bi-calendar-plus"></i> Created</span>
									<span class="act-val">{profile.createdAt || '—'}</span>
								</div>
								<div class="act-row">
									<span class="act-label"><i class="bi bi-clock-history"></i> Last updated</span>
									<span class="act-val">{profile.updatedAt || '—'}</span>
								</div>
							</div>
						</div>
					</div>
				</aside>

				<!-- ══ MAIN ══ -->
				<div class="profile-main" class:mobile-hidden={mobileTab !== 'details'}>
					<div class="fields-card">
						<!-- Username (read-only) -->
						<div class="field-row">
							<span class="field-label">Username</span>
							<div class="field-input-wrap">
								<span class="field-readonly mono">@{profile.username}</span>
							</div>
						</div>

						<!-- Full Name -->
						<div class="field-row">
							<span class="field-label">Full Name</span>
							<div class="field-input-wrap">
								<input
									class="form-control field-input"
									type="text"
									bind:value={editName}
									placeholder="Enter full name"
									on:keydown={(e) => {
										if (/[0-9]/.test(e.key)) e.preventDefault();
									}}
									on:input={() => clearFieldError('full_name')}
								/>
								{#if dirtyName}
									<div class="field-actions">
										<button
											class="fa-tick"
											type="button"
											on:click={saveProfile}
											disabled={isSaving}
											aria-label="Save"
										>
											<i class="bi bi-check-lg"></i>
										</button>
										<button
											class="fa-cancel"
											type="button"
											on:click={() => revertField('name')}
											aria-label="Cancel"
										>
											<i class="bi bi-x-lg"></i>
										</button>
									</div>
								{/if}
							</div>
							{#if fieldErrors['full_name']}
								<div class="field-error">{fieldErrors['full_name']}</div>
							{/if}
						</div>
						<!-- Role  -->
						<div class="field-row">
							<span class="field-label">
								Role
								{#if !canEditRole}<i class="bi bi-lock-fill ef-lock" title="No permission"></i>{/if}
							</span>
							<div class="field-input-wrap">
								<div class="field-select-wrap">
									<SearchableDropdown
										value={editRoleId}
										onChange={(v) => (editRoleId = v)}
										loadOptions={loadRoleOptions}
										placeholder="Search and assign role…"
										disabled={!canEditRole}
										disabledMessage="You do not have permission to change role"
									/>
								</div>
								{#if dirtyRole && canEditRole}
									<div class="field-actions">
										<button
											class="fa-tick"
											type="button"
											on:click={saveProfile}
											disabled={isSaving}
											aria-label="Save"
										>
											<i class="bi bi-check-lg"></i>
										</button>
										<button
											class="fa-cancel"
											type="button"
											on:click={() => revertField('role')}
											aria-label="Cancel"
										>
											<i class="bi bi-x-lg"></i>
										</button>
									</div>
								{/if}
							</div>
						</div>
						<!-- Designation -->
						<div class="field-row">
							<span class="field-label">Designation</span>
							<div class="field-input-wrap">
								<input
									class="form-control field-input"
									type="text"
									bind:value={editDesignation}
									placeholder="e.g. Operations Manager"
									on:input={() => clearFieldError('designation')}
								/>
								{#if dirtyDesig}
									<div class="field-actions">
										<button
											class="fa-tick"
											type="button"
											on:click={saveProfile}
											disabled={isSaving}
											aria-label="Save"
										>
											<i class="bi bi-check-lg"></i>
										</button>
										<button
											class="fa-cancel"
											type="button"
											on:click={() => revertField('designation')}
											aria-label="Cancel"
										>
											<i class="bi bi-x-lg"></i>
										</button>
									</div>
								{/if}
							</div>
							{#if fieldErrors['designation']}
								<div class="field-error">{fieldErrors['designation']}</div>
							{/if}
						</div>

						<!-- Gender -->
						<div class="field-row">
							<span class="field-label">Gender</span>
							<div class="field-input-wrap">
								<div class="field-select-wrap">
									<CustomSelect
										id="e-gender"
										label="Gender"
										value={editGender}
										options={genderOptions}
										onChange={(v) => (editGender = v)}
									/>
								</div>
								{#if dirtyGender}
									<div class="field-actions">
										<button
											class="fa-tick"
											type="button"
											on:click={saveProfile}
											disabled={isSaving}
											aria-label="Save"
										>
											<i class="bi bi-check-lg"></i>
										</button>
										<button
											class="fa-cancel"
											type="button"
											on:click={() => revertField('gender')}
											aria-label="Cancel"
										>
											<i class="bi bi-x-lg"></i>
										</button>
									</div>
								{/if}
							</div>
						</div>

						<!-- Email -->
						<div class="field-row">
							<span class="field-label">Email</span>
							<div class="field-input-wrap">
								<input
									class="form-control field-input"
									type="email"
									bind:value={editEmail}
									placeholder="name@company.com"
									on:input={() => clearFieldError('email_id')}
								/>
								{#if dirtyEmail}
									<div class="field-actions">
										<button
											class="fa-tick"
											type="button"
											on:click={saveProfile}
											disabled={isSaving}
											aria-label="Save"
										>
											<i class="bi bi-check-lg"></i>
										</button>
										<button
											class="fa-cancel"
											type="button"
											on:click={() => revertField('email')}
											aria-label="Cancel"
										>
											<i class="bi bi-x-lg"></i>
										</button>
									</div>
								{/if}
							</div>
							{#if fieldErrors['email_id']}
								<div class="field-error">{fieldErrors['email_id']}</div>
							{/if}
						</div>

						<!-- Phone -->
						<div class="field-row">
							<span class="field-label">Phone</span>
							<div class="field-input-wrap">
								<div class="prefix-wrap field-input {editPhone?.length ? 'show-prefix' : ''}">
									<span class="inline-prefix">+91</span>
									<input
										id="e-phone"
										class="form-control with-prefix"
										type="tel"
										bind:value={editPhone}
										placeholder="98765 43210"
										maxlength="10"
										on:keydown={(e) => {
											if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
										}}
										on:input={(e) => {
											const el = e.currentTarget as HTMLInputElement;
											el.value = el.value.replace(/[^\d]/g, '').slice(0, 10);
											editPhone = el.value;
											clearFieldError('phone_number');
										}}
									/>
								</div>
								{#if dirtyPhone}
									<div class="field-actions">
										<button
											class="fa-tick"
											type="button"
											on:click={saveProfile}
											disabled={isSaving}
											aria-label="Save"
										>
											<i class="bi bi-check-lg"></i>
										</button>
										<button
											class="fa-cancel"
											type="button"
											on:click={() => revertField('phone')}
											aria-label="Cancel"
										>
											<i class="bi bi-x-lg"></i>
										</button>
									</div>
								{/if}
							</div>
							{#if fieldErrors['phone_number']}
								<div class="field-error">{fieldErrors['phone_number']}</div>
							{/if}
						</div>

						<!-- Password -->
						<div class="field-row">
							<span class="field-label">Password <span class="field-hint">(new)</span></span>
							<div class="field-input-wrap">
								<div class="password-wrap field-input">
									{#if showPassword}
										<input
											id="e-pw"
											class="form-control with-toggle"
											type="text"
											bind:value={editPassword}
											placeholder="Leave blank to keep current"
											autocomplete="new-password"
											on:input={() => clearFieldError('password')}
										/>
									{:else}
										<input
											id="e-pw"
											class="form-control with-toggle"
											type="password"
											bind:value={editPassword}
											placeholder="Leave blank to keep current"
											autocomplete="new-password"
											on:input={() => clearFieldError('password')}
										/>
									{/if}
									<button
										class="password-toggle"
										type="button"
										on:click={() => (showPassword = !showPassword)}
										aria-label="Toggle password"
									>
										<i class="bi {showPassword ? 'bi-eye-slash' : 'bi-eye'}"></i>
									</button>
								</div>
								{#if dirtyPassword}
									<div class="field-actions">
										<button
											class="fa-tick"
											type="button"
											on:click={saveProfile}
											disabled={isSaving}
											aria-label="Save"
										>
											<i class="bi bi-check-lg"></i>
										</button>
										<button
											class="fa-cancel"
											type="button"
											on:click={() => revertField('password')}
											aria-label="Cancel"
										>
											<i class="bi bi-x-lg"></i>
										</button>
									</div>
								{/if}
							</div>
							{#if fieldErrors['password']}
								<div class="field-error">{fieldErrors['password']}</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	.page-root {
		background: var(--bg-primary);
		min-height: 100vh;
	}

	/* ═══════════════════════
	   LAYOUT
	   ═══════════════════════ */
	.profile-layout {
		display: grid;
		grid-template-columns: 380px 1fr;
		gap: 1.5rem;
		align-items: stretch;
		margin-top: 1.25rem;
	}

	/* ═══════════════════════
	   SIDEBAR
	   ═══════════════════════ */
	.profile-sidebar {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: sticky;
		top: 76px;
		align-self: stretch;
	}

	/* Identity card */
	.id-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 14px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.id-strip {
		height: 90px;
	}

	.id-body {
		padding: 0 1.35rem 1.4rem 1.35rem;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.avatar-anchor {
		position: relative;
		display: inline-block;
		align-self: flex-start;
		margin-top: -54px;
		margin-bottom: 0.9rem;
	}

	.avatar {
		width: 108px;
		height: 108px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.4rem;
		font-weight: 700;
		color: #fff;
		border: 4px solid var(--bg-card);
		user-select: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
		position: relative;
		overflow: hidden;
		cursor: default;
		padding: 0;
		outline: none;
	}
	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
		display: block;
	}
	.avatar-loader {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.06);
	}
	.avatar-dot {
		width: 28px;
		height: 28px;
		border: 3px solid rgba(255, 255, 255, 0.4);
		border-top-color: rgba(255, 255, 255, 0.95);
		border-radius: 50%;
		animation: avatar-spin 0.8s linear infinite;
	}
	@keyframes avatar-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.avatar-pencil-badge {
		position: absolute;
		right: -8px;
		bottom: -8px;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.45);
		color: white;
		border: 2px solid var(--bg-primary);
		cursor: pointer;
		backdrop-filter: blur(4px);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
		z-index: 3;
		padding: 0;
		transition: opacity 0.18s;
	}
	.avatar-pencil-badge i {
		font-size: 14px;
	}
	.avatar-pencil-badge:hover {
		opacity: 0.85;
	}

	.id-name {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 0.55rem 0;
		line-height: 1.2;
	}

	/* Role badge — prominent, right below name */
	.id-role-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.28rem 0.75rem;
		background: var(--detail-avatar-card);
		border: 1px solid var(--border);
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--edit-btn);
		margin-bottom: 0.5rem;
	}
	.id-role-badge i {
		font-size: 0.78rem;
	}
	.id-role-empty {
		color: var(--text-muted);
		background: var(--bg-primary);
		font-weight: 500;
		font-style: italic;
	}

	.id-desig {
		font-size: 0.82rem;
		color: var(--text-muted);
		margin: 0 0 0.85rem 0;
	}

	.id-chips {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.id-tag {
		font-size: 0.72rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--text-muted);
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: 5px;
		padding: 0.15rem 0.5rem;
	}

	/* Status chip */
	.status-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-size: 0.74rem;
		font-weight: 600;
		flex-shrink: 0;
	}
	.chip-on {
		background: var(--online-bg);
		color: var(--online-fg);
	}
	.chip-off {
		background: rgba(var(--border-rgb), 0.5);
		color: var(--text-muted);
	}
	.chip-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
		flex-shrink: 0;
	}

	.id-hr {
		border-color: var(--border);
		margin: 0.75rem 0;
		opacity: 1;
	}

	/* Contact list */
	.contact-list {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}
	.cl-row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.35rem 0.5rem;
		border-radius: 8px;
		background: var(--bg-primary);
	}
	.cl-icon {
		width: 28px;
		height: 28px;
		border-radius: 7px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.78rem;
		color: var(--edit-btn);
		flex-shrink: 0;
	}
	.cl-val {
		font-size: 0.8rem;
		color: var(--text-primary);
		line-height: 1.4;
		word-break: break-all;
		flex: 1;
		min-width: 0;
	}
	.cl-empty {
		color: var(--text-muted);
		font-style: italic;
	}

	/* Activity rows inside identity card */
	.act-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-top: auto;
	}
	.act-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.3rem 0.5rem;
		border-radius: 7px;
		background: var(--bg-primary);
	}
	.act-label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.71rem;
		color: var(--text-muted);
		font-weight: 500;
		white-space: nowrap;
	}
	.act-label i {
		font-size: 0.68rem;
		color: var(--edit-btn);
	}
	.act-val {
		font-size: 0.75rem;
		color: var(--text-primary);
		font-weight: 500;
		text-align: right;
	}

	/* ═══════════════════════
	   MAIN AREA
	   ═══════════════════════ */
	.profile-main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
		align-self: stretch;
	}

	/* ═══════════════════════
	   INLINE EDITABLE FIELDS
	   ═══════════════════════ */
	.fields-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: visible;
		flex: 1;
	}

	.field-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.6rem;
		padding: 0.55rem 1.1rem;
		border-bottom: 1px solid var(--border);
	}
	.field-row:last-child {
		border-bottom: none;
	}

	.field-label {
		width: 120px;
		min-width: 120px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.field-hint {
		font-weight: 400;
		font-size: 0.72rem;
	}

	.field-input-wrap {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.field-input {
		flex: 1;
		min-width: 0;
	}

	.field-select-wrap {
		flex: 1;
		min-width: 0;
	}

	.field-readonly {
		font-size: 0.88rem;
		color: var(--text-muted);
		font-style: italic;
	}

	.field-error {
		font-size: 0.72rem;
		color: #dc3545;
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-weight: 500;
		padding: 0 0 0.25rem 0;
		width: 100%;
		margin-top: -0.25rem;
		padding-left: calc(120px + 0.6rem);
	}

	.field-actions {
		display: flex;
		gap: 0.3rem;
		flex-shrink: 0;
	}

	.fa-tick,
	.fa-cancel {
		width: 28px;
		height: 28px;
		border-radius: 7px;
		border: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 0.8rem;
		transition: opacity 0.15s;
		padding: 0;
	}

	.fa-tick {
		background: var(--edit-btn);
		color: #fff;
	}
	.fa-tick:hover:not(:disabled) {
		opacity: 0.85;
	}
	.fa-tick:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.fa-cancel {
		background: var(--icon-hover-bg);
		color: var(--text-primary);
	}
	.fa-cancel:hover {
		opacity: 0.85;
	}

	.ef-lock {
		font-size: 0.7rem;
		color: var(--text-muted);
		opacity: 0.6;
	}

	/* Override global .form-control height for compact field rows */
	.fields-card :global(.form-control) {
		height: 38px !important;
		font-size: 0.875rem !important;
		padding-top: 0.3rem !important;
		padding-bottom: 0.3rem !important;
	}

	/* Phone - follows CreationForm pattern */
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

	/* Password - follows CreationForm pattern */
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
		font-size: 1rem;
		line-height: 1;
	}
	.password-toggle:hover {
		color: var(--text-primary);
	}

	/* Mobile tab toggle */
	.mobile-tabs {
		display: none;
		gap: 0.5rem;
		margin-top: 1rem;
		padding: 0.3rem;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 10px;
	}
	.mtab {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.83rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.18s;
	}
	.mtab-active {
		background: var(--edit-btn);
		color: #fff;
	}
	.mtab:not(.mtab-active):hover {
		background: var(--icon-hover-bg);
		color: var(--text-primary);
	}

	/* ═══════════════════════
	   RESPONSIVE
	   ═══════════════════════ */
	@media (max-width: 900px) {
		.profile-layout {
			grid-template-columns: 1fr;
		}
		.profile-sidebar {
			position: static;
		}
		.id-strip {
			height: 60px;
		}
		.mobile-tabs {
			display: flex;
		}
		.mobile-hidden {
			display: none !important;
		}
	}

	@media (max-width: 600px) {
		.field-label {
			width: 100%;
			min-width: 100%;
		}

		.field-row {
			flex-direction: column;
			align-items: stretch;
			gap: 0.6rem;
			padding: 0.75rem 1rem;
		}

		.field-input-wrap {
			flex-direction: row;
			gap: 0.4rem;
			align-items: center;
		}

		.field-input {
			flex: 1;
			min-width: 0;
		}

		.field-select-wrap {
			flex: 1;
			min-width: 0;
		}

		.prefix-wrap,
		.password-wrap {
			flex: 1;
		}

		.fa-tick,
		.fa-cancel {
			width: 28px;
			height: 28px;
			font-size: 0.75rem;
			border-radius: 6px;
		}

		.field-actions {
			gap: 0.25rem;
		}
		.field-error {
			font-size: 0.7rem;
			padding-left: 0;
			margin-top: -0.25rem;
		}
	}
</style>
