<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { SEARCH_DEBOUNCE_DELAY } from '$lib/constants';
	import toast from '$lib/utils/toast';
	import { canAssignService, canUnassignService } from '$lib/utils/permissions';

	//-- Props --
	export let serviceId: number;
	//-- Props for API functions --
	export let loadOperators: (
		q?: string,
		limit?: number,
		offset?: number
	) => Promise<Array<{ id: number; name: string }>> = async () => [];
	export let assignOperator: (
		serviceId: number,
		operatorId: number
	) => Promise<{ assignmentId: number }> = async () => ({ assignmentId: 0 });

	export let unassignOperator: (assignmentId: number) => Promise<void> = async () => {};
	export let fetchAssignedOperators: (
		serviceId: number
	) => Promise<Array<{ id: number; name: string; assignmentId: number }>> = async () => [];

	let assignedCount = 0;
	const PAGE_SIZE = 10;

	let open = false;
	let query = '';
	let rootEl: HTMLElement;
	let listEl: HTMLElement;
	let inputEl: HTMLInputElement;

	let operators: Array<{ id: number; name: string }> = [];
	let loading = false;
	let loadingMore = false;
	let hasMore = true;
	let currentOffset = 0;
	let currentSearch: string | undefined = undefined;
	let _currentRequestId = 0;

	let assignmentMap = new Map<number, number>();
	let loadingAssigned = false;

	let actionLoading = new Set<number>();
	let _debounceTimer: any = null;
	//-- Load assigned operators on serviceId change --
	async function loadAssigned() {
		loadingAssigned = true;
		try {
			const assigned = await fetchAssignedOperators(serviceId);
			const m = new Map<number, number>();
			for (const a of assigned) {
				m.set(a.id, a.assignmentId);
			}
			assignmentMap = m;
		} catch (err) {
			console.error('OperatorAssignmentDropdown: failed to fetch assigned', err);
		} finally {
			loadingAssigned = false;
		}
	}

	//-- Load operators with optional search and pagination --
	async function loadItems(search?: string, append = false) {
		if (!append) {
			_currentRequestId++;
			loading = true;
			currentOffset = 0;
			hasMore = true;
			operators = [];
		} else {
			loadingMore = true;
		}
		currentSearch = search;
		const requestId = _currentRequestId;

		try {
			const fetched = await loadOperators(search, PAGE_SIZE, currentOffset);
			if (requestId !== _currentRequestId) return;
			const mapped = fetched.map((r: any) => ({
				id: Number(r.id),
				name: String(r.name ?? r.full_name ?? r.username ?? `Operator #${r.id}`)
			}));

			operators = append ? [...operators, ...mapped] : mapped;
			hasMore = fetched.length >= PAGE_SIZE;
			currentOffset += fetched.length;
		} catch (err) {
			console.error('OperatorAssignmentDropdown: failed to load operators', err);
			operators = [];
			hasMore = false;
			toast.error('Failed to load operators.');
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	//-- Handle scroll for infinite loading --
	function handleListScroll() {
		if (!listEl || loadingMore || !hasMore) return;
		const { scrollTop, scrollHeight, clientHeight } = listEl;
		if (scrollTop + clientHeight >= scrollHeight - 30) {
			loadItems(currentSearch, true);
		}
	}
	//-- Handle input with debounce --
	function handleInput() {
		if (_debounceTimer) clearTimeout(_debounceTimer);
		_debounceTimer = setTimeout(() => {
			loadItems(query.trim() || undefined, false);
		}, SEARCH_DEBOUNCE_DELAY);
	}

	//-- Handle focus to open dropdown and load items if not already loaded --
	function handleFocus() {
		open = true;
		if (operators.length === 0) loadItems();
	}

	//-- Assign operator to service --
	async function handleAssign(op: { id: number; name: string }) {
		if (actionLoading.has(op.id)) return;
		actionLoading = new Set([...actionLoading, op.id]);
		try {
			const { assignmentId } = await assignOperator(serviceId, op.id);
			const m = new Map(assignmentMap);
			m.set(op.id, assignmentId);
			assignmentMap = m;
			toast.success(`${op.name} assigned`);
		} catch (err) {
			console.error('OperatorAssignmentDropdown: assign failed', err);
			toast.error(`Failed to assign ${op.name}`);
		} finally {
			actionLoading = new Set([...actionLoading].filter((id) => id !== op.id));
		}
	}

	//-- Unassign operator from service --
	async function handleUnassign(op: { id: number; name: string }) {
		if (actionLoading.has(op.id)) return;
		const assignmentId = assignmentMap.get(op.id);
		if (assignmentId == null) {
			toast.error('Assignment record not found — try refreshing');
			return;
		}
		actionLoading = new Set([...actionLoading, op.id]);
		try {
			await unassignOperator(assignmentId);
			const m = new Map(assignmentMap);
			m.delete(op.id);
			assignmentMap = m;
			toast.success(`${op.name} unassigned`);
		} catch (err) {
			console.error('OperatorAssignmentDropdown: unassign failed', err);
			toast.error(`Failed to unassign ${op.name}`);
		} finally {
			actionLoading = new Set([...actionLoading].filter((id) => id !== op.id));
		}
	}

	//-- Assigned operators float to top --
	$: sortedOperators = [
		...operators.filter((o) => assignmentMap.has(o.id)),
		...operators.filter((o) => !assignmentMap.has(o.id))
	];

	$: assignedCount = assignmentMap.size;

	//-- Reload assignments and reset operator list when serviceId changes --
	let _previousServiceId: number | undefined = undefined;
	$: if (serviceId !== _previousServiceId) {
		_previousServiceId = serviceId;
		assignmentMap = new Map();
		operators = [];
		query = '';
		open = false;
		currentOffset = 0;
		hasMore = true;
		loadAssigned();
		loadItems();
	}

	onMount(() => {
		loadAssigned();

		const handleClickOutside = (e: MouseEvent) => {
			if (open && rootEl && !rootEl.contains(e.target as Node)) {
				open = false;
			}
		};
		document.addEventListener('click', handleClickOutside, true);
		return () => document.removeEventListener('click', handleClickOutside, true);
	});

	onDestroy(() => {
		if (_debounceTimer) clearTimeout(_debounceTimer);
	});
</script>

<div class="operator-assignment" bind:this={rootEl}>
	<p class="assign-label">Service Assignment</p>

	<div class="input-wrap">
		<i class="bi bi-person-badge input-icon" aria-hidden="true"></i>
		<input
			bind:this={inputEl}
			type="search"
			class="assign-input"
			placeholder="Assign operator"
			bind:value={query}
			on:focus={handleFocus}
			on:input={() => {
				handleInput();
				if (!open) open = true;
			}}
			autocomplete="off"
		/>
		{#if query}
			<button
				type="button"
				class="clear-btn"
				on:click={() => {
					query = '';
					loadItems(undefined, false);
					inputEl?.focus();
				}}
				aria-label="Clear search"
			>
				<i class="bi bi-x-lg"></i>
			</button>
		{:else}
			<div class="chevron-wrapper">
				{#if assignedCount > 0}
					<span
						class="assignee-badge"
						title={`${assignedCount} operator${assignedCount !== 1 ? 's' : ''} assigned`}
					>
						{assignedCount}
					</span>
				{/if}
				<button
					type="button"
					class="chevron-btn"
					aria-label={open ? 'Close dropdown' : 'Open dropdown'}
					title={open ? 'Close' : 'Open'}
					on:click={() => {
						open = !open;
						if (open && operators.length === 0) loadItems();
					}}
				>
					<i class="bi bi-chevron-down" class:rotated={open}></i>
				</button>
			</div>
		{/if}
	</div>

	{#if open}
		<div class="dropdown-menu">
			{#if loading}
				<div class="dropdown-state">
					<i class="bi bi-arrow-repeat spinner"></i>
					<span>Loading operators…</span>
				</div>
			{:else if sortedOperators.length === 0}
				<div class="dropdown-state">
					<i class="bi bi-person-x"></i>
					<span>No operators found</span>
				</div>
			{:else}
				<div class="operator-list" bind:this={listEl} on:scroll={handleListScroll}>
					{#each sortedOperators as op (op.id)}
						{@const isAssigned = assignmentMap.has(op.id)}
						{@const isLoading = actionLoading.has(op.id)}
						<div class="operator-item" class:is-assigned={isAssigned}>
							<div class="op-left">
								<div class="op-avatar" class:avatar-assigned={isAssigned}>
									{op.name.charAt(0).toUpperCase()}
								</div>
								<div class="op-info">
									<span class="op-name">{op.name}</span>
									<span class="op-id">ID #{op.id}</span>
								</div>
							</div>

							{#if isAssigned}
								<button
									type="button"
									class="action-btn unassign-btn"
									disabled={isLoading || !canUnassignService()}
									title={!canUnassignService() ? 'Permission denied' : ''}
									on:click={() => handleUnassign(op)}
								>
									{#if isLoading}
										<i class="bi bi-arrow-repeat spinner-sm"></i>
									{:else}
										<i class="bi bi-person-dash"></i>
									{/if}
									Unassign
								</button>
							{:else}
								<button
									type="button"
									class="action-btn assign-btn"
									disabled={isLoading || !canAssignService()}
									title={!canAssignService() ? 'Permission denied' : ''}
									on:click={() => handleAssign(op)}
								>
									{#if isLoading}
										<i class="bi bi-arrow-repeat spinner-sm"></i>
									{:else}
										<i class="bi bi-person-plus"></i>
									{/if}
									Assign
								</button>
							{/if}
						</div>
					{/each}

					{#if loadingMore}
						<div class="load-more-row">
							<i class="bi bi-arrow-repeat spinner-sm"></i>
							Loading more…
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.operator-assignment {
		position: relative;
	}

	.assign-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 6px;
	}

	.input-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-icon {
		position: absolute;
		left: 11px;
		font-size: 14px;
		color: var(--text-muted);
		pointer-events: none;
		z-index: 1;
	}

	.assign-input {
		width: 100%;
		height: 38px;
		padding: 0 36px 0 34px;
		border: 1px solid var(--border);
		border-radius: 9px;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 13px;
		outline: none;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.assign-input::placeholder {
		color: var(--text-muted);
	}

	.assign-input:focus {
		border-color: var(--edit-btn);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--edit-btn) 15%, transparent);
	}

	.assign-input::-webkit-search-cancel-button {
		display: none;
	}

	.clear-btn {
		position: absolute;
		right: 10px;
		background: none;
		border: none;
		padding: 0;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.15s ease;
	}

	.clear-btn:hover {
		color: var(--text-primary);
	}

	.chevron-wrapper {
		display: flex;
		align-items: center;
		gap: 6px;
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
	}

	.assignee-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 5px;
		background: var(--edit-btn);
		color: #fff;
		border-radius: 10px;
		font-size: 11px;
		font-weight: 600;
		cursor: default;
	}

	.chevron-btn {
		background: none;
		border: none;
		padding: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		font-size: 16px;
		transition:
			color 0.15s ease,
			transform 0.2s ease;
	}

	.chevron-btn:hover {
		color: var(--edit-btn);
	}

	.chevron-btn i {
		display: inline-block;
		transition: transform 0.2s ease;
	}

	.chevron-btn i.rotated {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 5px);
		left: 0;
		right: 0;
		background: var(--bg-card);
		border: 2px solid var(--edit-btn);
		border-radius: 11px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
		z-index: 9999;
		overflow: visible;
		width: 100%;
		display: block;
		min-height: 80px;
	}

	.dropdown-state {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 16px 14px;
		font-size: 13px;
		color: var(--text-muted);
	}

	.operator-list {
		max-height: 260px;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding: 4px;
	}

	.operator-list::-webkit-scrollbar {
		display: none;
	}

	.operator-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 7px 8px;
		border-radius: 8px;
		transition: background 0.15s ease;
	}

	.operator-item:hover {
		background: var(--bg-primary);
	}

	.operator-item.is-assigned {
		background: color-mix(in srgb, var(--edit-btn) 6%, transparent);
	}

	.operator-item.is-assigned:hover {
		background: color-mix(in srgb, var(--edit-btn) 10%, transparent);
	}

	.op-left {
		display: flex;
		align-items: center;
		gap: 9px;
		min-width: 0;
		flex: 1;
	}

	.op-avatar {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--bg-primary);
		border: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 12px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.op-avatar.avatar-assigned {
		background: var(--edit-btn);
		color: #fff;
		border-color: var(--edit-btn);
	}

	.op-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.op-name {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.op-id {
		font-size: 11px;
		color: var(--text-muted);
		margin-top: 1px;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		flex-shrink: 0;
		height: 28px;
		padding: 0 10px;
		border-radius: 7px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		border: 1px solid transparent;
		transition:
			opacity 0.15s ease,
			background 0.15s ease;
		white-space: nowrap;
	}

	.action-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed !important;
	}

	.assign-btn {
		background: var(--edit-btn);
		color: #fff;
		border-color: var(--edit-btn);
	}

	.assign-btn:not(:disabled):hover {
		opacity: 0.88;
	}

	.unassign-btn {
		background: var(--clear-btn-bg, transparent);
		color: var(--delete-btn);
		border-color: var(--delete-btn);
	}

	.unassign-btn:not(:disabled):hover {
		opacity: 0.8;
	}

	.spinner,
	.spinner-sm {
		animation: spin 0.9s linear infinite;
		display: inline-block;
	}

	.spinner {
		font-size: 15px;
	}
	.spinner-sm {
		font-size: 12px;
	}

	.load-more-row {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 12px;
		font-size: 12px;
		color: var(--text-muted);
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
