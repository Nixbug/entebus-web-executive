<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ColumnSelector from '$lib/components/ColumnSelector.svelte';
	import DataTable from '$lib/components/ListingTable.svelte';
	import NameCell from '$lib/components/TableNameCell.svelte';
	import { getColorFromName } from '$lib/color-palette';
	import {
		getInitialVisibleColumns,
		utcToIstFormat,
		titleCase,
		mapGenderToLabel,
		mapStatusToLabel,
		getLoggedInUserId,
		getInitials
	} from '$lib/helpers';
	import {
		GENDER,
		GENDER_VALUE_BY_LABEL,
		GENDER_FILTER_OPTIONS,
		STATUS,
		STATUS_VALUE_BY_LABEL,
		STATUS_FILTER_OPTIONS
	} from '$lib/constants';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import CreationForm from '$lib/components/CreationForm.svelte';
	import {
		fetchExecutiveAccount,
		createExecutiveAccount,
		updateExecutiveAccount,
		deleteExecutiveAccount
	} from '$lib/services/executive-account';
	import { fetchExecutiveRoleList } from '$lib/services/executive-role';
	import {
		createRoleMap,
		fetchRoleMap,
		type CreateRoleMapRequest,
		updateRoleMap,
		deleteRoleMap,
		type UpdateRoleMapRequest
	} from '$lib/services/executive-role-map';
	import { executiveAccountSchema } from '$lib/schemas';
	import type { Executive } from '$lib/types/type';
	import type { DetailConfig } from '$lib/types/detail-config';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import DynamicDetailSidebar from '$lib/components/detailpage-components/DynamicDetailSidebar.svelte';
	import { getExecutiveDetailConfig } from '$lib/configs/executive-detail.config';
	import { onMount } from 'svelte';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import {
		canDeleteExecutiveAccount,
		canCreateExecutiveAccount,
		canUpdateExecutiveAccount,
		canUpdateExecutiveRole
	} from '$lib/utils/permissions';

	let selected: Executive | null = null;
	let showDetail = false;
	let detailConfig: DetailConfig | null = null;

	//-- Load available roles for the dropdown --
	async function loadRoleOptions(
		q?: string,
		limit: number = 10,
		offset: number = 0
	): Promise<Array<{ id: number; name: string }>> {
		try {
			const result = await fetchExecutiveRoleList({ search: q, limit, offset });
			if (!Array.isArray(result)) return [];

			return result
				.map((role: any) => ({
					id: Number(role.id || role.apiId),
					name: String(role.name)
				}))
				.slice(0, limit);
		} catch (err) {
			console.error('Failed to load roles:', err);
			return [];
		}
	}

	//-- Open Detail Sidebar --
	let detailRequestId = 0;
	async function openDetail(row: Executive) {
		const currentDetailRequestId = ++detailRequestId;
		selected = row;
		let rolesDisplay = '';
		let roleId = '';
		let roleMapId: number | null = null;

		//-- Fetch and assign roles for the executive --
		if (row.apiId) {
			try {
				//-- Get role mappings for this executive --
				const roleMap = await fetchRoleMap(row.apiId);
				if (currentDetailRequestId !== detailRequestId) return; //-- stale response, discard --
				if (roleMap && roleMap.length > 0) {
					//-- Single-role model: use only the first mapping --
					const firstRoleMap = roleMap[0];
					roleMapId = firstRoleMap.id || null;

					if (firstRoleMap.role_id != null) {
						roleId = String(firstRoleMap.role_id);

						//-- Fetch role name for the assigned role --
						const roleData = await fetchExecutiveRoleList({ id: firstRoleMap.role_id });
						if (currentDetailRequestId !== detailRequestId) return; //-- stale response, discard --
						const roleName =
							Array.isArray(roleData) && roleData.length > 0
								? (roleData[0] as any).name || 'Unknown'
								: 'Unknown';

						rolesDisplay = roleName;
					}
				}
			} catch (err) {
				if (currentDetailRequestId !== detailRequestId) return; //-- stale error, discard --
				console.error('Failed to fetch executive roles:', err);
				rolesDisplay = 'Failed to load roles';
			}
		}

		//-- Add role data as properties so DynamicDetailSidebar can access them --
		selected = {
			...selected,
			rolesDisplay: rolesDisplay || 'No roles assigned',
			roleId: roleId,
			roleMapId: roleMapId
		};

		//-- Generate detail config after roles are loaded --
		detailConfig = getExecutiveDetailConfig(selected, loadRoleOptions, canUpdateExecutiveRole());

		//-- Show detail sidebar only after config and roles are ready --
		showDetail = true;
	}

	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;
	let hasNextPage = false;

	//-- request id to prevent stale response race conditions --
	let requestId = 0;

	let formattedExecutiveData: Executive[] = [];
	let totalItems = 0;
	let loading = false;

	function formatPhone(phone: string | null | undefined, asDisplay = false): string {
		if (!phone) return '';
		const digits = String(phone).replace(/\D/g, '');
		const normalized = digits.length > 10 ? digits.slice(-10) : digits;
		if (!normalized) return '';
		return asDisplay ? `+91 ${normalized}` : normalized;
	}

	//-- Fetch executives from API with current search, filters, and pagination --
	async function fetchExecutives() {
		const currentRequestId = ++requestId;
		loading = true;
		hasNextPage = false;
		totalItems = 0;
		try {
			const genderFilter =
				activeFilters.gender && !String(activeFilters.gender).toLowerCase().startsWith('all')
					? GENDER_VALUE_BY_LABEL[String(activeFilters.gender)]
					: undefined;
			const statusFilter =
				activeFilters.status && !String(activeFilters.status).toLowerCase().startsWith('all')
					? STATUS_VALUE_BY_LABEL[String(activeFilters.status)]
					: undefined;

			const apiData = await fetchExecutiveAccount({
				search: searchTerm,
				gender: genderFilter,
				status: statusFilter,
				limit: itemsPerPage,
				offset: (currentPage - 1) * itemsPerPage
			});

			if (currentRequestId !== requestId) return; //-- stale response, discard --
			const loggedInUserId = getLoggedInUserId();
			formattedExecutiveData = apiData.map((item: any) => ({
				id: item.id ? `EXE-${item.id}` : '',
				apiId: item.id ?? null,
				username: item.username ?? '',
				password: '',
				name: titleCase(item.full_name ?? item.username ?? ''),
				designation: titleCase(item.designation ?? ''),
				gender: titleCase(mapGenderToLabel(item.gender)),
				status: titleCase(mapStatusToLabel(item.status)),
				email: item.email_id ?? '',
				phone: formatPhone(item.phone_number, true),
				isActive: item.status === STATUS.ACTIVE,
				isYou: item.id === loggedInUserId,
				createdAt: utcToIstFormat(item.created_on ?? item.createdAt ?? ''),
				updatedAt: utcToIstFormat(item.updated_on ?? item.updatedAt ?? '')
			}));

			const apiTotal = (apiData as any)?.total;
			if (typeof apiTotal === 'number' && !Number.isNaN(apiTotal)) {
				totalItems = apiTotal;
				const fetchedCount = Array.isArray(apiData)
					? (currentPage - 1) * itemsPerPage + apiData.length
					: 0;
				hasNextPage = fetchedCount < apiTotal;
			} else if (Array.isArray(apiData)) {
				const fetchedCount = (currentPage - 1) * itemsPerPage + apiData.length;

				if (apiData.length === 0 && currentPage > 1) {
					currentPage = Math.max(1, currentPage - 1);
					return await fetchExecutives();
				}

				hasNextPage = apiData.length === itemsPerPage;
				totalItems = hasNextPage ? fetchedCount + 1 : fetchedCount; //-- +1 signals next page exists --
			} else {
				totalItems = 0;
				hasNextPage = false;
			}
		} catch (e) {
			if (currentRequestId !== requestId) return; //-- stale error, discard --
			formattedExecutiveData = [];
			totalItems = 0;
			hasNextPage = false;
			const message = await handleApiError(e);
			toast.error(message || 'Failed to fetch executives.');
		}
		loading = false;
	}

	//-- Handle page change from Pagination component --
	function handlePageChange(p: number) {
		currentPage = p;
		fetchExecutives();
	}

	//-- Search/Filter setup --
	let searchTerm = '';
	let activeFilters: Record<string, string> = {};
	const filters = [
		{
			label: 'Gender',
			key: 'gender',
			options: GENDER_FILTER_OPTIONS
		},
		{ label: 'Status', key: 'status', options: STATUS_FILTER_OPTIONS }
	];
	//-- Handle search/filter updates --
	function handleSearchAndFilterUpdate(event: CustomEvent) {
		searchTerm = event.detail?.searchTerm ?? '';
		activeFilters = event.detail?.activeFilters ?? {};
		currentPage = 1;
		fetchExecutives();
	}

	//-- Column Selector setup --
	const defaultColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'designation', label: 'Designation' },
		{ key: 'gender', label: 'Gender', isChip: true },
		{ key: 'status', label: 'Status', isChip: true }
	];
	const optionalColumns = [
		{ key: 'email', label: 'Email' },
		{ key: 'phone', label: 'Phone Number' },
		{ key: 'createdAt', label: 'Created At' }
	];

	//-- Start with only default columns visible, no optional ones --
	let visibleColumns = getInitialVisibleColumns(defaultColumns, optionalColumns, []);
	$: displayedColumns = [...defaultColumns, ...optionalColumns].filter((col) =>
		visibleColumns.includes(col.key)
	);

	function handleColumnChange(selectedOptionalColumns: string[]) {
		visibleColumns = [...defaultColumns.map((c) => c.key), ...selectedOptionalColumns];
	}

	//-- Custom Renderers --
	const customRender: Record<string, any> = {
		name: NameCell
	};

	//-- Add Executive --
	let showModal = false;
	let isSubmitting = false;
	const executiveFields = [
		{
			name: 'fullName',
			label: 'Full Name',
			placeholder: 'Enter full name',
			required: true
		},
		{
			name: 'username',
			label: 'Username',
			placeholder: 'Enter username',
			required: true
		},
		{
			name: 'password',
			label: 'Password',
			type: 'password',
			placeholder: 'Enter password',
			required: true
		},
		{
			name: 'role',
			label: 'Role',
			placeholder: 'Assign role (optional)',
			searchableOptions: true,
			disabled: !canUpdateExecutiveRole(),
			disabledMessage: 'You do not have permission to assign roles'
		},
		{
			name: 'gender',
			label: 'Gender',
			options: ['Male', 'Female', 'Transgender', 'Other'],
			placeholder: 'Select gender'
		},
		{
			name: 'designation',
			label: 'Designation',
			placeholder: 'e.g., Operations Manager'
		},
		{
			name: 'email',
			label: 'Email Address',
			type: 'email',
			placeholder: 'name@entebus.com'
		},
		{
			name: 'phone',
			label: 'Phone Number',
			type: 'tel',
			placeholder: '+91 98765 43210'
		}
	];

	function handleAddExecutive() {
		showModal = true;
	}

	//-- Create Executive Handling --
	async function handleSubmitExecutiveCreate(e: CustomEvent) {
		const formData = e.detail as Record<string, string>;
		const payload = {
			username: formData.username,
			password: formData.password,
			gender:
				GENDER_VALUE_BY_LABEL[formData.gender] !== undefined
					? GENDER_VALUE_BY_LABEL[formData.gender]
					: GENDER.OTHER,
			full_name: formData.fullName || null,
			designation: formData.designation || null,
			phone_number: formData.phone ? `+91 ${formData.phone}` : null,
			email_id: formData.email || null
		};

		isSubmitting = true;
		try {
			const created = await createExecutiveAccount(payload);
			toast.success('Executive account created successfully.');
			//-- Attempt role assignment if a role was selected --
			const roleId = formData.role ? Number(formData.role) : null;
			//-- Extract executiveId from the created executive response (handle different possible shapes) --
			const executiveId: number | null = (() => {
				if (!created) return null;
				if (Array.isArray(created) && created.length > 0) {
					const first = created[0] as Record<string, any> | null;
					if (first && first.id !== undefined && first.id !== null) return Number(first.id);
				}
				if (typeof created === 'object' && (created as Record<string, any>).id !== undefined)
					return Number((created as Record<string, any>).id);
				return null;
			})();

			//-- Only attempt role assignment if roleId and executiveId are valid and user has permission --
			if (roleId && executiveId && canUpdateExecutiveRole()) {
				try {
					await createRoleMap({
						role_id: roleId,
						executive_id: executiveId
					} as CreateRoleMapRequest);
				} catch (err: any) {
					const msg = await handleApiError(err);
					toast.error(msg || 'Failed to assign role to executive.');
				}
			}
			showModal = false;
			fetchExecutives();
		} catch (err) {
			const message = await handleApiError(err);
			toast.error(message || 'Failed to create executive account.');
		} finally {
			isSubmitting = false;
		}
	}

	//-- Save (update) selected executive --
	async function handleUpdateExecutive(updated: unknown) {
		if (!selected) return;
		const id = Number(selected.apiId);
		if (!id || Number.isNaN(id)) {
			toast.error('Unable to determine executive id');
			return false;
		}

		const u = updated as Record<string, any>;
		const payload: Record<string, any> = {};

		const passwordInput = String(u.password || '').trim();
		if (passwordInput !== '') {
			payload.password = passwordInput;
		}
		if ((u.name || '') !== (selected?.name || '')) {
			payload.full_name = u.name || null;
		}
		if ((u.designation || '') !== (selected?.designation || '')) {
			payload.designation = u.designation || null;
		}
		if ((u.email || '') !== (selected?.email || '')) {
			payload.email_id = u.email || null;
		}
		if ((u.gender || '') !== (selected?.gender || '')) {
			const genderVal = GENDER_VALUE_BY_LABEL[String(u.gender)];
			if (genderVal !== undefined) payload.gender = genderVal;
		}
		if (!selected?.isYou && (u.status || '') !== (selected?.status || '')) {
			const statusVal = STATUS_VALUE_BY_LABEL[String(u.status)];
			if (statusVal !== undefined) payload.status = statusVal;
		}

		const phoneDigits = formatPhone(u.phone, false);
		const selectedPhoneDigits = formatPhone(selected?.phone, false);
		if (phoneDigits !== selectedPhoneDigits) {
			payload.phone_number = phoneDigits ? `+91 ${phoneDigits}` : null;
		}

		try {
			//-- Update executive account details --
			await updateExecutiveAccount(id, payload);
		} catch (err: any) {
			const message = await handleApiError(err);
			toast.error(message || 'Failed to update executive.');
			return false;
		}

		//-- Handle role assignment/update if role changed (separate try/catch) --
		const newRoleId = u.roleId ? Number(u.roleId) : null;
		const oldRoleId = selected?.roleId ? Number(selected.roleId) : null;
		const roleMapId = selected?.roleMapId || null;

		if (newRoleId !== oldRoleId && canUpdateExecutiveRole()) {
			try {
				if (newRoleId) {
					//-- If old role exists, update it; otherwise create new role assignment --
					if (roleMapId) {
						//-- Update existing role mapping --
						const updatePayload: UpdateRoleMapRequest = {
							role_id: newRoleId
						};
						await updateRoleMap(roleMapId, updatePayload);
					} else {
						//-- Create new role mapping --
						const createPayload: CreateRoleMapRequest = {
							role_id: newRoleId,
							executive_id: id
						};
						await createRoleMap(createPayload);
					}
				} else if (roleMapId) {
					//-- User cleared the role - delete the existing role mapping --
					await deleteRoleMap(roleMapId);
				}
			} catch (err: any) {
				const msg = await handleApiError(err);
				toast.warning(msg || 'Executive updated, but role update failed.');
			}
		}

		//-- Executive updated successfully (role may have failed but that's already warned) --
		toast.success('Executive updated successfully.');
		showDetail = false;
		selected = null;
		await fetchExecutives();
		return true;
	}

	//-- Delete selected executive --
	async function handleDeleteSelected() {
		if (!selected) return false;
		try {
			const id = Number(selected.apiId);
			if (!id || Number.isNaN(id)) {
				toast.error('Unable to determine executive id');
				return false;
			}

			await deleteExecutiveAccount(id);
			toast.success('Executive deleted successfully.');
			showDetail = false;
			selected = null;
			await fetchExecutives();
			return true;
		} catch (e: any) {
			if (e.status === 403 && selected?.isYou) {
				toast.error("You can't delete your own account.");
			} else {
				const message = await handleApiError(e);
				toast.error(message || 'Failed to delete executive.');
			}
			return false;
		}
	}

	onMount(() => {
		fetchExecutives();
	});
</script>

<!-- LAYOUT -->
<div class="main-div d-flex flex-column min-vh-100">
	{#if loading}
		<div class="spinner-overlay">
			<div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{/if}
	<div class="d-flex flex-column">
		<div class="sticky-top">
			<HeaderBar />
		</div>
		<main class="container-xl py-5 page-wrapper">
			<!-- HOME BUTTON -->
			<HomeButton />
			<!-- PAGE HEADER -->
			<ListingPageHeader
				title="Account Management"
				subtitle="View and manage all executive accounts"
				buttonLabel="Add Executive"
				icon="bi-plus-lg"
				onButtonClick={handleAddExecutive}
				isInitiallyEnabled={canCreateExecutiveAccount()}
				disabledTooltip={'You do not have permission to add executive accounts.'}
			/>
			<!-- SEARCH & FILTER BAR -->
			<SearchFilterBar
				searchPlaceholder="Search by name, ID, designation, or email..."
				{filters}
				on:update={handleSearchAndFilterUpdate}
			/>
			<!-- TABLE VIEW (Desktop) -->
			<div class="d-none d-md-block">
				<DataTable
					data={formattedExecutiveData}
					columns={displayedColumns}
					{visibleColumns}
					{customRender}
					tableName="Executives"
					on:rowClick={(e: any) => openDetail(e.detail)}
				/>
			</div>
			<!-- CARD VIEW (Mobile) -->
			<div class="d-md-none">
				{#each formattedExecutiveData as exec}
					<div
						class="exec-card d-flex align-items-center justify-content-between p-3 rounded-4 mb-2"
						style="background-color: var(--bg-card);"
						role="button"
						tabindex="0"
						on:click={() => openDetail(exec)}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								openDetail(exec);
							} else if (e.key === ' ') {
								e.preventDefault();
								openDetail(exec);
							}
						}}
					>
						<div class="d-flex align-items-center gap-4">
							<!-- Avatar -->
							<div class="position-relative">
								<div
									class="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center"
									style="width: 48px; height: 48px; background-color: {getColorFromName(
										exec.name
									)};"
								>
									{getInitials(exec.initials, exec.name, '')}
									<span
										class="status-dot"
										class:active={exec.isActive}
										aria-label={exec.isActive ? 'Active' : 'Inactive'}
										role="status"
									></span>
								</div>
							</div>

							<!-- Info -->
							<div>
								<div class="fw-inter-700 main-info">
									{exec.name}
									{#if exec.isYou}
										<span class="badge bg-primary text-white ms-2">You</span>
									{/if}
								</div>
								<div class="small sub-info">{exec.designation}</div>
								<div class="small sub-info">{exec.id} • {exec.gender} • {exec.status}</div>
							</div>
						</div>

						<i class="bi bi-chevron-right text-secondary" aria-hidden="true"></i>
					</div>
				{/each}
				{#if !loading && totalItems === 0}
					<EmptyData message="No executives found" />
				{/if}

				<!-- Add Executive Button (Mobile)-->
				<FloatingAddButton
					onClick={handleAddExecutive}
					tooltip="Add new executive"
					isInitiallyEnabled={canCreateExecutiveAccount()}
				/>
			</div>
			<!-- Modal creation form  -->
			<CreationForm
				open={showModal}
				{isSubmitting}
				fields={executiveFields}
				schema={executiveAccountSchema}
				optionLoader={loadRoleOptions}
				title="Add New Executive"
				titleIcon="bi bi-person-plus"
				on:submit={handleSubmitExecutiveCreate}
				on:close={() => (showModal = false)}
			/>
			{#if totalItems > 0 || hasNextPage}
				<!-- Pagination -->
				<Pagination
					{totalItems}
					{itemsPerPage}
					{currentPage}
					hasMore={hasNextPage}
					onPageChange={handlePageChange}
				/>
			{/if}

			{#if showDetail && detailConfig && selected}
				<DynamicDetailSidebar
					config={detailConfig}
					data={selected}
					sectionName="executive"
					on:close={() => (showDetail = false)}
					onDelete={handleDeleteSelected}
					hasDeletePermission={canDeleteExecutiveAccount()}
					hasUpdatePermission={canUpdateExecutiveAccount() || selected.isYou}
					onSave={(updated: unknown) => handleUpdateExecutive(updated)}
				/>
			{/if}
			<!-- Column Selector -->
			<div class="mt-3" style="position: fixed; bottom: 1rem; right: 1rem;">
				<ColumnSelector
					{defaultColumns}
					{optionalColumns}
					{visibleColumns}
					onChange={handleColumnChange}
				/>
			</div>
		</main>
	</div>
</div>

<!-- style -->
<style>
	.main-div {
		background-color: var(--bg-primary);
		position: relative;
	}
	@media (max-width: 768px) {
		main {
			padding: 2rem;
		}
	}
	@media (max-width: 1200px) {
		.page-wrapper {
			padding: 2rem;
		}
	}
	.main-info {
		color: var(--text-primary);
	}
	.sub-info {
		color: var(--text-muted);
	}
	.status-dot {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--status-dot-inactive);
		border: 1px solid #fff;
	}

	.status-dot.active {
		background-color: var(--status-dot-active);
	}
</style>
