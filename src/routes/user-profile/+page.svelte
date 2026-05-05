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

	let editMode = false;
	let isSaving = false;
	let showPassword = false;

	let editName = '';
	let editDesignation = '';
	let editGender = '';
	let editEmail = '';
	let editPhone = '';
	let editPassword = '';
	let editRoleId = '';
	let editRoleName = '';

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

	function enterEditMode() {
		if (!profile) return;
		editName = profile.name;
		editDesignation = profile.designation;
		editGender = profile.gender;
		editEmail = profile.email;
		editPhone = phoneDigitsOnly(profile.phone);
		editPassword = '';
		editRoleId = profile.roleId;
		editRoleName = profile.roleName;
		showPassword = false;
		editMode = true;
	}

	function cancelEdit() {
		editMode = false;
		showPassword = false;
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
		editMode = false;
		showPassword = false;
		await loadProfile();
		isSaving = false;
	}

	onMount(async () => {
		await loadProfile();
		await loadProfileImage();
	});

	$: avatarColor = profile?.name ? getColorFromName(profile.name) : '#0d6efd';
	$: initials = profile?.name ? getInitials(null, profile.name) : '?';
	$: canEditRole = canUpdateExecutiveRole();
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
			<div class="profile-layout">
				<!-- ══ SIDEBAR ══ -->
				<aside class="profile-sidebar">
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
										<span class="avatar-spinner spinner-border spinner-border-sm" role="status"
										></span>
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

							<h2 class="id-name">{profile.name || profile.username}</h2>

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
								<span class="id-tag">{profile.id}</span>
								<span class="status-chip {profile.isActive ? 'chip-on' : 'chip-off'}">
									<span class="chip-dot"></span>{profile.status}
								</span>
							</div>

							<hr class="id-hr" />

							<div class="contact-list">
								{#if profile.email}
									<div class="cl-row">
										<span class="cl-icon"><i class="bi bi-envelope"></i></span>
										<span class="cl-val">{profile.email}</span>
									</div>
								{/if}
								{#if profile.phone}
									<div class="cl-row">
										<span class="cl-icon"><i class="bi bi-telephone"></i></span>
										<span class="cl-val mono">{profile.phone}</span>
									</div>
								{/if}
								<div class="cl-row">
									<span class="cl-icon"><i class="bi bi-at"></i></span>
									<span class="cl-val mono">@{profile.username}</span>
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
				<div class="profile-main">
					{#if !editMode}
						<div class="main-bar">
							<h3 class="main-title">Profile Details</h3>
							<button class="btn-edit" on:click={enterEditMode}>
								<i class="bi bi-pencil"></i> Edit Profile
							</button>
						</div>

						<div class="info-cards">
							<div class="info-card">
								<div class="ic-head">
									<span class="ic-icon"><i class="bi bi-person"></i></span>
									Personal
								</div>
								<div class="ic-grid">
									<div class="ic-cell">
										<span class="ic-label">Full Name</span>
										<span class="ic-val">{profile.name || '—'}</span>
									</div>
									<div class="ic-cell">
										<span class="ic-label">Username</span>
										<span class="ic-val mono">@{profile.username || '—'}</span>
									</div>
									<div class="ic-cell">
										<span class="ic-label">Designation</span>
										<span class="ic-val">{profile.designation || '—'}</span>
									</div>
									<div class="ic-cell">
										<span class="ic-label">Gender</span>
										<span class="ic-val">{profile.gender || '—'}</span>
									</div>
								</div>
							</div>
							<div class="info-card">
								<div class="ic-head">
									<span class="ic-icon"><i class="bi bi-shield-shaded"></i></span>
									Access & Permissions
								</div>
								<div class="ic-grid">
									<div class="ic-cell">
										<span class="ic-label">Assigned Role</span>
										<span class="ic-val">
											{#if profile.roleName}
												<span class="role-pill">{profile.roleName}</span>
											{:else}
												<span class="ic-empty">None</span>
											{/if}
										</span>
									</div>
									<div class="ic-cell">
										<span class="ic-label">Account Status</span>
										<span class="ic-val">
											<span class="status-chip {profile.isActive ? 'chip-on' : 'chip-off'}">
												<span class="chip-dot"></span>{profile.status}
											</span>
										</span>
									</div>
								</div>
							</div>
							<div class="info-card">
								<div class="ic-head">
									<span class="ic-icon"><i class="bi bi-send-check"></i></span>
									Contact Information
								</div>
								<div class="ic-grid">
									<div class="ic-cell ic-cell-full">
										<span class="ic-label">Email Address</span>
										<span class="ic-val" style="word-break:break-all;">{profile.email || '—'}</span>
									</div>
									<div class="ic-cell">
										<span class="ic-label">Phone</span>
										<span class="ic-val mono">{profile.phone || '—'}</span>
									</div>
								</div>
							</div>
						</div>
					{:else}
						<div class="main-bar">
							<h3 class="main-title">Edit Profile</h3>
							<div class="main-bar-actions">
								<button class="btn-discard" on:click={cancelEdit} disabled={isSaving}
									>Discard</button
								>
								<button class="btn-save" on:click={saveProfile} disabled={isSaving}>
									{#if isSaving}
										<span class="spinner-border spinner-border-sm" role="status"></span> Saving…
									{:else}
										<i class="bi bi-check-lg"></i> Save Changes
									{/if}
								</button>
							</div>
						</div>

						<div class="edit-cards">
							<div class="edit-card">
								<div class="ec-head">
									<span class="ic-icon"><i class="bi bi-person"></i></span>
									Personal Information
								</div>
								<div class="ec-fields">
									<div class="ef-group">
										<label class="ef-lbl" for="e-name">Full Name</label>
										<input
											id="e-name"
											class="form-control"
											type="text"
											bind:value={editName}
											placeholder="Enter full name"
										/>
									</div>
									<div class="ef-group">
										<label class="ef-lbl" for="e-desig">Designation</label>
										<input
											id="e-desig"
											class="form-control"
											type="text"
											bind:value={editDesignation}
											placeholder="e.g. Operations Manager"
										/>
									</div>
									<div class="ef-group">
										<label class="ef-lbl" for="e-gender">Gender</label>
										<CustomSelect
											id="e-gender"
											label="Gender"
											value={editGender}
											options={genderOptions}
											onChange={(v) => (editGender = v)}
										/>
									</div>
								</div>
							</div>
							<div class="edit-card">
								<div class="ec-head">
									<span class="ic-icon"><i class="bi bi-shield-shaded"></i></span>
									Access & Security
								</div>
								<div class="ec-fields">
									<div class="ef-group">
										<label class="ef-lbl" for="e-role">
											Role Assignment
											{#if !canEditRole}<i class="bi bi-lock-fill ef-lock" title="No permission"
												></i>{/if}
										</label>
										<SearchableDropdown
											value={editRoleId}
											onChange={(v) => (editRoleId = v)}
											loadOptions={loadRoleOptions}
											placeholder="Search and assign role…"
											disabled={!canEditRole}
											disabledMessage="You do not have permission to change role"
										/>
									</div>
									<div class="ef-group">
										<label class="ef-lbl" for="e-pw">
											New Password
											<span class="ef-hint">(leave blank to keep current)</span>
										</label>
										<div class="password-wrap">
											{#if showPassword}
												<input
													id="e-pw"
													class="form-control with-toggle"
													type="text"
													bind:value={editPassword}
													placeholder="Enter new password"
													autocomplete="new-password"
												/>
											{:else}
												<input
													id="e-pw"
													class="form-control with-toggle"
													type="password"
													bind:value={editPassword}
													placeholder="Enter new password"
													autocomplete="new-password"
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
									</div>
								</div>
							</div>
							<div class="edit-card">
								<div class="ec-head">
									<span class="ic-icon"><i class="bi bi-send-check"></i></span>
									Contact Information
								</div>
								<div class="ec-fields">
									<div class="ef-group">
										<label class="ef-lbl" for="e-email">Email Address</label>
										<input
											id="e-email"
											class="form-control"
											type="email"
											bind:value={editEmail}
											placeholder="name@company.com"
										/>
									</div>
									<div class="ef-group">
										<label class="ef-lbl" for="e-phone">Phone Number</label>
										<div class="prefix-wrap {editPhone?.length ? 'show-prefix' : ''}">
											<span class="inline-prefix">+91</span>
											<input
												id="e-phone"
												class="form-control with-prefix"
												type="tel"
												bind:value={editPhone}
												placeholder="98765 43210"
												maxlength="10"
											/>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Mobile actions -->
						<div class="mobile-bar">
							<button class="btn-discard flex-fill" on:click={cancelEdit} disabled={isSaving}
								>Discard</button
							>
							<button class="btn-save flex-fill" on:click={saveProfile} disabled={isSaving}>
								{#if isSaving}
									<span class="spinner-border spinner-border-sm" role="status"></span> Saving…
								{:else}
									<i class="bi bi-check-lg"></i> Save
								{/if}
							</button>
						</div>
					{/if}
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
		grid-template-columns: 288px 1fr;
		gap: 1.5rem;
		align-items: start;
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
	}

	/* Identity card */
	.id-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 14px;
		overflow: hidden;
	}

	.id-strip {
		height: 68px;
	}

	.id-body {
		padding: 0 1.35rem 1.4rem 1.35rem;
	}

	.avatar-anchor {
		position: relative;
		display: inline-block;
		margin-top: -34px;
		margin-bottom: 0.8rem;
	}

	.avatar {
		width: 68px;
		height: 68px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
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
	.avatar-spinner {
		color: #fff;
	}

	.avatar-pencil-badge {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: 2px solid var(--bg-card);
		background: var(--edit-btn);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6rem;
		cursor: pointer;
		padding: 0;
		transition: opacity 0.18s;
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
		font-family: 'Courier New', monospace;
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
		margin: 1rem 0;
		opacity: 1;
	}

	/* Contact list */
	.contact-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.cl-row {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
	}
	.cl-icon {
		width: 26px;
		height: 26px;
		border-radius: 6px;
		background: var(--bg-primary);
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
		line-height: 1.7;
		word-break: break-all;
	}
	.cl-val.mono {
		font-family: 'Courier New', monospace;
	}

	/* Activity rows inside identity card */
	.act-list {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.act-row {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.act-label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.71rem;
		color: var(--text-muted);
		font-weight: 500;
	}
	.act-label i {
		font-size: 0.68rem;
		color: var(--edit-btn);
	}
	.act-val {
		font-size: 0.8rem;
		color: var(--text-primary);
		font-weight: 500;
	}

	/* ═══════════════════════
	   MAIN AREA
	   ═══════════════════════ */
	.profile-main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
	}

	.main-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.main-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}
	.main-bar-actions {
		display: flex;
		gap: 0.6rem;
		align-items: center;
	}

	/* Buttons */
	.btn-edit {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.48rem 1.1rem;
		border-radius: 8px;
		border: 1px solid var(--edit-btn);
		background: var(--edit-btn);
		color: #fff;
		font-size: 0.83rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.18s;
	}
	.btn-edit:hover {
		opacity: 0.88;
	}

	.btn-discard {
		padding: 0.48rem 1rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-muted);
		font-size: 0.83rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.18s;
	}
	.btn-discard:hover:not(:disabled) {
		background: var(--icon-hover-bg);
		color: var(--text-primary);
	}
	.btn-discard:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.btn-save {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.48rem 1.15rem;
		border-radius: 8px;
		border: none;
		background: var(--edit-btn);
		color: #fff;
		font-size: 0.83rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.18s;
	}
	.btn-save:hover:not(:disabled) {
		opacity: 0.88;
	}
	.btn-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ── View mode info cards ── */
	.info-cards {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.info-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
		transition: border-color 0.18s;
	}
	.info-card:hover {
		border-color: var(--edit-btn);
	}

	.ic-head {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.8rem 1.25rem;
		background: var(--bg-primary);
		border-bottom: 1px solid var(--border);
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}
	.ic-icon {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		background: var(--detail-avatar-card);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.78rem;
		color: var(--edit-btn);
		flex-shrink: 0;
	}

	/* 2-column data grid inside card */
	.ic-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	.ic-cell {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.95rem 1.25rem;
		border-right: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
	}
	/* Remove right border from even cells, bottom from last row */
	.ic-cell:nth-child(2n) {
		border-right: none;
	}
	.ic-cell:nth-last-child(-n + 2) {
		border-bottom: none;
	}
	/* Full width override */
	.ic-cell.ic-cell-full {
		grid-column: 1 / -1;
		border-right: none;
	}
	.ic-cell.ic-cell-full:last-child {
		border-bottom: none;
	}

	.ic-label {
		font-size: 0.72rem;
		color: var(--text-muted);
		font-weight: 500;
	}
	.ic-val {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	.ic-val.mono {
		font-family: 'Courier New', monospace;
		font-size: 0.83rem;
	}
	.ic-empty {
		font-size: 0.83rem;
		color: var(--text-muted);
		font-style: italic;
		font-weight: 400;
	}

	.role-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.65rem;
		background: var(--detail-avatar-card);
		border: 1px solid var(--border);
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--edit-btn);
	}

	/* ── Edit cards ── */
	.edit-cards {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.edit-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: visible;
	}

	.ec-head {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.8rem 1.25rem;
		background: var(--bg-primary);
		border-bottom: 1px solid var(--border);
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.ec-fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
		gap: 1rem;
		padding: 1.1rem 1.25rem;
	}

	/* Field group */
	.ef-group {
		display: flex;
		flex-direction: column;
		gap: 0.38rem;
	}

	.ef-lbl {
		font-size: 0.77rem;
		font-weight: 600;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.ef-hint {
		font-weight: 400;
		font-size: 0.72rem;
		color: var(--text-muted);
	}
	.ef-lock {
		font-size: 0.7rem;
		color: var(--text-muted);
		opacity: 0.6;
	}

	/* Form fields use global .form-control styling from app.css */

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

	/* Mobile bar */
	.mobile-bar {
		display: none;
		gap: 0.6rem;
		padding-top: 0.25rem;
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
	}

	@media (max-width: 600px) {
		.ic-grid {
			grid-template-columns: 1fr;
		}
		.ic-cell {
			border-right: none;
			border-bottom: 1px solid var(--border);
		}
		.ic-cell:last-child {
			border-bottom: none;
		}

		.ec-fields {
			grid-template-columns: 1fr;
		}

		.main-bar-actions {
			display: none;
		}
		.mobile-bar {
			display: flex;
		}

		.main-bar {
			flex-wrap: wrap;
		}
		.btn-edit {
			width: 100%;
			justify-content: center;
		}
	}
</style>
