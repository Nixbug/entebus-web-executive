<script lang="ts">
	//-- servicecreatePanel.svelte
	import { createEventDispatcher, onDestroy } from 'svelte';
	import SearchableDropdown from '$lib/components/SearchableDropdown.svelte';
	import { SERVICE_TICKET_MODE_LABEL_BY_VALUE } from '$lib/constants';
	import { fetchLandmarkInRoute } from '$lib/services/route-landmarks';
	import { fetchFareList } from '$lib/services/dynamic-fare';
	import { fetchLandmarkList } from '$lib/services/landmark';
	import { fetchRoute } from '$lib/services/route-landmarks';
	import type {
		ServiceRouteStop,
		LandmarkMap,
		ServiceFare,
		Landmark,
		TimeSelection
	} from '$lib/types/type';
	import TimeSelector from '$lib/components/route-components/TimeSelector.svelte';
	//-- Props --
	export let loadRoutes:
		| ((
				q?: string,
				limit?: number,
				offset?: number
		  ) => Promise<Array<{ id: number; name: string }>>)
		| null = null;
	export let loadFares:
		| ((
				q?: string,
				limit?: number,
				offset?: number
		  ) => Promise<Array<{ id: number; name: string }>>)
		| null = null;
	export let loadVehicles:
		| ((
				q?: string,
				limit?: number,
				offset?: number
		  ) => Promise<Array<{ id: number; name: string }>>)
		| null = null;

	const dispatch = createEventDispatcher<{
		preview: {
			route: ServiceRouteStop[];
			landmarkMap: LandmarkMap;
			fare: ServiceFare | null;
			loading?: boolean;
		};
		create: { payload: Record<string, any> };
	}>();

	//-- Selected IDs --
	let selectedRouteId: string | undefined = undefined;
	let selectedFareId: string | undefined = undefined;
	let selectedVehicleId: string | undefined = undefined;

	//-- Text fields --
	let name = '';
	let nameError = '';

	const NAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9 _.-]*[A-Za-z0-9])?$/;

	function validateName(value: string): string {
		if (!value) return '';
		if (!NAME_PATTERN.test(value)) {
			return 'Service name must start and end with alphanumeric characters, and can contain spaces, underscores, dots, or dashes.';
		}
		return '';
	}

	$: nameError = validateName(name);

	//-- Starting time --
	let startingDate = todayDateString();
	let startingTime = '06:00';
	let userHasEditedTime = false;
	let timeSelection: TimeSelection = { days: 1, hours: 6, minutes: 0, period: 'AM' };
	let isUpdatingFromTimeSelector = false;
	let isUpdatingFromTime = false;

	$: if (!isUpdatingFromTimeSelector && startingTime) {
		isUpdatingFromTime = true;
		let [h, m] = startingTime.split(':').map(Number);
		let period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
		let hours12 = h % 12;
		if (hours12 === 0) hours12 = 12;
		timeSelection = { days: 1, hours: hours12, minutes: m, period };
		isUpdatingFromTime = false;
	}

	function handleTimeSelectorChange(val: TimeSelection) {
		if (isUpdatingFromTime) return;
		isUpdatingFromTimeSelector = true;
		userHasEditedTime = true;

		let h = (val.hours ?? 0) % 12;
		if (val.period === 'PM') h += 12;
		if (val.period === 'AM' && h === 12) h = 0;
		startingTime = `${String(h).padStart(2, '0')}:${String(val.minutes).padStart(2, '0')}`;
		timeSelection = val;
		isUpdatingFromTimeSelector = false;
	}

	//-- Ticket mode options --
	const ticketModeOptions = Object.entries(SERVICE_TICKET_MODE_LABEL_BY_VALUE).map(
		([val, label]) => ({
			value: Number(val),
			label
		})
	);
	let selectedTicketMode: number = ticketModeOptions[0]?.value ?? 1;

	//-- Generate state --
	let generating = false;
	let generateError: string | null = null;

	//-- Auto generate state --
	let autoGenerateTimer: number | null = null;
	const AUTO_GENERATE_DEBOUNCE_MS = 300;
	let latestGenId = 0; //-- To track the latest generation request and ignore outdated responses if needed --
	let pendingGenerate = false; //-- To track if a generation request is pending while another is in progress, so we can run it immediately after the current one finishes instead of dropping it --
	function scheduleAutoGenerate() {
		if (autoGenerateTimer) {
			clearTimeout(autoGenerateTimer as any);
			autoGenerateTimer = null;
		}

		if (generating) {
			pendingGenerate = true; // <-- queue it instead of dropping it
			return;
		}

		autoGenerateTimer = window.setTimeout(() => {
			if (generating) {
				pendingGenerate = true; // <-- queue it instead of dropping
			} else {
				handleGenerate();
			}
			autoGenerateTimer = null;
		}, AUTO_GENERATE_DEBOUNCE_MS);
	}

	//-- Computed state --
	//-- can generate if route + fare are selected (vehicle and time are optional for generation) --
	$: canGenerate = !!selectedRouteId && !!selectedFareId;
	//-- can create if route + fare + vehicle + starting date/time are selected --
	$: canCreate =
		!!selectedRouteId &&
		!!selectedFareId &&
		!!selectedVehicleId &&
		startingDate !== '' &&
		startingTime !== '';

	//-- Helpers --
	function todayDateString(): string {
		const nowUtc = new Date();
		const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
		const nowIst = new Date(nowUtc.getTime() + istOffsetMs);
		return `${nowIst.getUTCFullYear()}-${String(nowIst.getUTCMonth() + 1).padStart(2, '0')}-${String(nowIst.getUTCDate()).padStart(2, '0')}`;
	}

	function addDaysToDateString(dateStr: string, days: number): string {
		const [y, m, d] = dateStr.split('-').map(Number);
		const dt = new Date(y, (m ?? 1) - 1, d + days);
		return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
			dt.getDate()
		).padStart(2, '0')}`;
	}

	//-- Date picker boundaries: only allow today and tomorrow --
	$: dateMin = todayDateString();
	$: dateMax = addDaysToDateString(dateMin, 1);

	//-- Keep startingDate within allowed range --
	$: if (startingDate) {
		if (startingDate < dateMin || startingDate > dateMax) {
			startingDate = dateMin;
		}
	}

	/**
	 * Convert route start_time ("HH:MM:SSZ" UTC) + delta (minutes) → ISO UTC string
	 * Uses the selected date as the calendar base.
	 */
	function deltaToIso(startTimeUtc: string, deltaMinutes: number, dateStr: string): string {
		if (startTimeUtc.includes('T')) {
			const base = new Date(startTimeUtc);
			base.setMinutes(base.getMinutes() + deltaMinutes);
			return base.toISOString();
		}

		const match = startTimeUtc.match(/^(\d{1,2}):(\d{2})(?::\d+)?Z?$/);
		if (!match) {
			throw new Error(`Invalid route start time format: ${startTimeUtc}`);
		}

		const utcHours = parseInt(match[1]);
		const utcMinutes = parseInt(match[2]);

		const base = new Date(
			`${dateStr}T${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}:00Z`
		);
		base.setMinutes(base.getMinutes() + deltaMinutes);
		return base.toISOString();
	}

	//-- Generate timeline based on selected route + fare --
	async function handleGenerate() {
		if (!canGenerate) return;
		generating = true;
		generateError = null;
		const myGenId = ++latestGenId;
		try {
			//-- 1. Fetch landmarks in the selected route → get landmark_id, distance_from_start, arrival_delta, departure_delta --
			const rawLandmarksInRoute: any[] = await fetchLandmarkInRoute({
				route_id: Number(selectedRouteId)
			});
			if (!Array.isArray(rawLandmarksInRoute) || rawLandmarksInRoute.length === 0) {
				throw new Error('Selected route has no stops configured.');
			}

			//-- 2: Determine route start time in UTC.
			//   startingTime is always shown in IST — either pre-filled from the route's
			//   start_time via utcToIstTimeStr, or manually edited by the user.
			//   We always build the UTC instant from startingDate + startingTime treating
			//   them as IST (UTC+5:30). Using Date.UTC then subtracting the IST offset
			//   avoids the browser's local timezone shifting the date (e.g. 12 AM IST
			//   Apr 30 → Apr 29 UTC mismatch that was causing the "shows tomorrow" bug). --
			const [hStr, mStr] = startingTime.split(':');
			const [y, mo, d] = startingDate.split('-').map(Number);
			const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
			const utcMs = Date.UTC(y, (mo ?? 1) - 1, d, Number(hStr), Number(mStr)) - istOffsetMs;
			const routeStartTimeUtc = new Date(utcMs).toISOString();

			//-- 3. Sort landmarks by distance_from_start --
			const sorted = [...rawLandmarksInRoute].sort(
				(a, b) => (a.distance_from_start ?? 0) - (b.distance_from_start ?? 0)
			);

			//-- 4. Build route stops with arrival/departure times by adding deltas to route start time --
			const routeStops: ServiceRouteStop[] = sorted.map((rl: any) => ({
				serviceId: 0,
				landmarkId: Number(rl.landmark_id),
				arrivalAt: deltaToIso(routeStartTimeUtc, Number(rl.arrival_delta ?? 0), startingDate),
				departureAt: deltaToIso(routeStartTimeUtc, Number(rl.departure_delta ?? 0), startingDate),
				distanceFromStart: Number(rl.distance_from_start ?? 0)
			}));

			//-- 5. Fetch landmark names --
			const landmarkIds = sorted.map((rl: any) => Number(rl.landmark_id));
			const rawLandmarks: any[] = await fetchLandmarkList({ id_list: landmarkIds });
			const landmarkMap: LandmarkMap = {};
			rawLandmarks.forEach((raw: any) => {
				const apiId = Number(raw.id);
				const lm: Landmark = {
					id: String(raw.id),
					apiId,
					name: raw.name ?? '',
					boundary: raw.boundary ?? '',
					type: String(raw.type ?? ''),
					createdAt: raw.created_on,
					updatedAt: raw.updated_on ?? undefined
				};
				landmarkMap[apiId] = lm;
			});

			//-- 6. Fetch fare details --
			const rawFares: any[] = await fetchFareList({ id: Number(selectedFareId) });
			const rawFare = rawFares?.[0] ?? null;
			if (!rawFare) throw new Error('Could not load fare details.');

			const fare: ServiceFare = {
				fareId: rawFare.id,
				id: rawFare.id,
				name: rawFare.name,
				version: rawFare.version ?? 1,
				function: rawFare.function ?? '',
				attributes: rawFare.attributes ?? {
					df_version: 1,
					ticket_types: [],
					currency_type: 'INR',
					distance_unit: 'm',
					extras: {}
				}
			};

			if (myGenId !== latestGenId) return; //-- If a newer generation has been triggered, ignore this result --
			//-- 7. Dispatch preview with route stops + landmark map + fare details --
			dispatch('preview', { route: routeStops, landmarkMap, fare });
		} catch (err) {
			if (myGenId !== latestGenId) return; //-- If a newer generation has been triggered, ignore this error --
			generateError = (err as Error).message;
			console.error('Generate timeline failed:', err);
			dispatch('preview', { route: [], landmarkMap: {}, fare: null, loading: false });
		} finally {
			generating = false;
			if (pendingGenerate) {
				pendingGenerate = false;
				handleGenerate();
			}
		}
	}

	//-- Selected route start time (kept for reference, no longer used directly in generation) --
	let selectedRouteStartTime = '00:00:00Z';

	//-- Fetch routes with metadata for dropdown --
	// This function uses `fetchRoute(...)` as the authoritative source so we can
	// populate `rawRouteMap` with route metadata (for example `start_time`) which
	// is required to pre-fill the start time shown to users. The `loadRoutes` prop
	// is accepted by the component but not used as the primary data source here. --
	async function loadRoutesWithMeta(
		q?: string,
		limit?: number,
		offset?: number
	): Promise<Array<{ id: number; name: string }>> {
		if (!loadRoutes) return [];
		const companyIdParam =
			typeof window !== 'undefined'
				? (() => {
						const params = new URLSearchParams(window.location.search);
						return params.get('companyId') ?? params.get('id');
					})()
				: null;
		const companyId = companyIdParam ? Number(companyIdParam) : undefined;

		const result = await fetchRoute({
			search: q,
			limit: limit ?? 10,
			offset: offset ?? 0,
			company_id: companyId,
			status: 1
		});
		if (!Array.isArray(result)) return [];

		// Merge results into `rawRouteMap` keyed by id so paginated loads accumulate
		// instead of overwriting. Reassign to trigger Svelte reactivity.
		result.forEach((r: any) => {
			rawRouteMap[String(r.id)] = r;
		});
		rawRouteMap = rawRouteMap;

		return result.map((r: any) => ({ id: Number(r.id), name: String(r.name) }));
	}

	let rawRouteMap: Record<string, any> = {};

	//-- Convert UTC time string ("HH:MM...") to IST "HH:MM" for display --
	function utcToIstTimeStr(utcTime: string): string {
		const match = utcTime.match(/^(\d{1,2}):(\d{2})/);
		if (!match) return '06:00';
		let h = parseInt(match[1]);
		let m = parseInt(match[2]);
		let totalMinutes = h * 60 + m + 330;
		totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;
		const istH = Math.floor(totalMinutes / 60);
		const istM = totalMinutes % 60;
		return `${String(istH).padStart(2, '0')}:${String(istM).padStart(2, '0')}`;
	}

	//-- When selectedRouteId changes, look up its start_time from rawRouteMap and pre-fill the time --
	$: if (selectedRouteId && Object.keys(rawRouteMap).length > 0) {
		const found = rawRouteMap[selectedRouteId];
		selectedRouteStartTime = found?.start_time ?? '00:00:00Z';
		if (found?.start_time && !userHasEditedTime) {
			startingTime = utcToIstTimeStr(found.start_time);
		}
	}

	//-- Auto generate whenever route/fare/vehicle/time selection changes and all required fields are set for generation --
	$: {
		const shouldAuto =
			!!selectedRouteId &&
			!!selectedFareId &&
			!!selectedVehicleId &&
			startingDate !== '' &&
			startingTime !== '';
		if (shouldAuto) {
			dispatch('preview', { route: [], landmarkMap: {}, fare: null, loading: true });
			scheduleAutoGenerate();
		} else {
			dispatch('preview', { route: [], landmarkMap: {}, fare: null });
		}
	}
	//-- Clear auto generate timer on destroy --
	onDestroy(() => {
		if (autoGenerateTimer) {
			clearTimeout(autoGenerateTimer as any);
			autoGenerateTimer = null;
		}
	});

	function handleCreate() {
		//-- Convert startingDate + startingTime (IST) to UTC ISO string --
		const [hStr, mStr] = startingTime.split(':');
		const [y, mo, d] = startingDate.split('-').map(Number);
		const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
		const utcMillis = Date.UTC(y, (mo ?? 1) - 1, d, Number(hStr), Number(mStr)) - IST_OFFSET_MS;
		const startingAtIso = new Date(utcMillis).toISOString();

		//-- Dispatch create event with all selected options --
		dispatch('create', {
			payload: {
				route_id: selectedRouteId ? Number(selectedRouteId) : undefined,
				fare_id: selectedFareId ? Number(selectedFareId) : undefined,
				vehicle_id: selectedVehicleId ? Number(selectedVehicleId) : undefined,
				name: name.trim() || null,
				ticket_mode: selectedTicketMode,
				starting_at: startingAtIso
			}
		});
	}
</script>

<aside class="panel">
	<!-- Header -->
	<div class="panel-header">
		<p class="panel-eyebrow">New service</p>
		<h1 class="panel-title">Create service</h1>
	</div>

	<!-- Form -->
	<div class="fields">
		<!-- Vehicle -->
		<div class="field-group">
			<p class="field-label">
				<span class="ficon icon-vehicle">
					<i class="bi bi-truck" aria-hidden="true" style="color:#185FA5"></i>
				</span>
				Vehicle<span class="hint">(Active vehicles only)</span>
			</p>
			<SearchableDropdown
				placeholder="Search vehicles…"
				loadOptions={loadVehicles ?? (() => Promise.resolve([]))}
				value={selectedVehicleId}
				onChange={(v) => (selectedVehicleId = v)}
			/>
		</div>
		<!-- Fare -->
		<div class="field-group">
			<p class="field-label">
				<span class="ficon icon-fare">
					<i class="bi bi-wallet2" aria-hidden="true" style="color:#854F0B"></i>
				</span>
				Fare plan
			</p>
			<SearchableDropdown
				placeholder="Search fares…"
				loadOptions={loadFares ?? (() => Promise.resolve([]))}
				value={selectedFareId}
				onChange={(v) => (selectedFareId = v)}
			/>
		</div>
		<!-- Route -->
		<div class="field-group">
			<p class="field-label">
				<span class="ficon icon-route">
					<i class="bi bi-signpost-split" aria-hidden="true" style="color:#0F6E56"></i>
				</span>
				Route<span class="hint">(valid route only)</span>
			</p>
			<SearchableDropdown
				placeholder="Search routes…"
				loadOptions={loadRoutesWithMeta}
				value={selectedRouteId}
				onChange={(v) => (selectedRouteId = v)}
			/>
		</div>

		<!-- show the start time field only if a route is selected -->
		{#if selectedRouteId}
			<!-- Starting at -->
			<div class="field-group">
				<p class="field-label">
					<span class="ficon icon-time">
						<i class="bi bi-clock" aria-hidden="true" style="color:#2a5298"></i>
					</span>
					Starting at <span class="hint">(IST)</span>
				</p>
				<div class="datetime-row">
					<div class="date-options" role="tablist" aria-label="Select start date">
						<button
							type="button"
							class="date-chip"
							class:selected={startingDate === dateMin}
							on:click={() => (startingDate = dateMin)}
						>
							<span class="date-label">Today</span>
							<span class="date-sub"
								>{new Date(dateMin).toLocaleDateString(undefined, {
									month: 'short',
									day: 'numeric'
								})}</span
							>
						</button>

						<button
							type="button"
							class="date-chip"
							class:selected={startingDate === dateMax}
							on:click={() => (startingDate = dateMax)}
						>
							<span class="date-label">Tomorrow</span>
							<span class="date-sub"
								>{new Date(dateMax).toLocaleDateString(undefined, {
									month: 'short',
									day: 'numeric'
								})}</span
							>
						</button>
					</div>
				</div>
				<div class="time-selector-row">
					<TimeSelector
						bind:value={timeSelection}
						showDays={false}
						on:change={(e) => handleTimeSelectorChange(e.detail)}
					/>
				</div>
			</div>
		{/if}

		<!-- Service name -->
		<div class="field-group">
			<p class="field-label">
				<span class="ficon icon-name">
					<i class="bi bi-card-text" aria-hidden="true" style="color:#2a5298"></i>
				</span>
				Service name <span class="hint">(optional)</span>
			</p>
			<input class="text-input" class:input-error={nameError} type="text" placeholder="e.g. Morning Express" bind:value={name} />
			{#if nameError}
				<p class="field-error">{nameError}</p>
			{/if}</div>

		<!-- Ticket mode -->
		<div class="field-group">
			<p class="field-label">
				<span class="ficon icon-mode">
					<i class="bi bi-ticket-detailed" aria-hidden="true" style="color:#534AB7"></i>
				</span>
				Ticket mode
			</p>
			<div class="mode-chips">
				{#each ticketModeOptions as opt}
					<button
						type="button"
						class="mode-chip"
						class:selected={selectedTicketMode === opt.value}
						on:click={() => (selectedTicketMode = opt.value)}>{opt.label}</button
					>
				{/each}
			</div>
		</div>
	</div>

	<!-- Action bar -->
	<div class="action-bar">
		<!-- Create service -->
		<button
			class="action-btn create-btn"
			type="button"
			disabled={!canCreate}
			on:click={handleCreate}
		>
			<i class="bi bi-plus-lg"></i> Create service
		</button>

		{#if generateError}
			<p class="generate-error">{generateError}</p>
		{/if}
	</div>
</aside>

<style>
	.panel {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* ── Header ── */
	.panel-header {
		padding: 18px 20px 16px;
		border-bottom: 1px solid var(--border);
	}

	.panel-eyebrow {
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 4px;
	}

	.panel-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-primary);
	}

	/* ── Fields ── */
	.fields {
		padding: 4px 20px;
		flex: 1;
		overflow-y: auto;
	}

	.field-group {
		padding: 12px 0;
		border-bottom: 1px solid var(--border);
	}
	.field-group:last-child {
		border-bottom: none;
	}

	.field-label {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 11px;
		color: var(--text-primary);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 8px;
	}

	.hint {
		text-transform: none;
		font-size: 10px;
		opacity: 0.7;
	}

	.ficon {
		width: 22px;
		height: 22px;
		border-radius: 6px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.icon-vehicle {
		background: #e6f1fb;
	}
	.icon-route {
		background: #e1f5ee;
	}
	.icon-fare {
		background: #faeeda;
	}
	.icon-mode {
		background: #eeedfe;
	}
	.icon-time {
		background: #e8effe;
	}
	.icon-name {
		background: #e8effe;
	}
	/* ── Date + time row ── */
	.datetime-row {
		display: flex;
		gap: 0.7rem;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	.date-options {
		display: flex;
		gap: 0.6rem;
	}
	.date-chip {
		display: inline-flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 8px 10px;
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: 8px;
		min-width: 84px;
		text-align: left;
		cursor: pointer;
		opacity: 0.45; /* muted when not selected */
		transition:
			opacity 0.12s,
			transform 0.12s;
	}
	.date-chip:hover {
		opacity: 0.75;
		transform: translateY(-1px);
	}
	.date-chip.selected {
		opacity: 1;
		font-weight: 600;
		border-color: var(--edit-btn);
		background: var(--bg-card);
	}
	.date-label {
		font-size: 12px;
		color: var(--text-primary);
	}
	.date-sub {
		font-size: 12px;
		color: var(--text-muted);
	}
	.time-selector-row {
		margin-left: 0.1rem;
		margin-bottom: 0.5rem;
	}

	/* ── Inputs ── */
	.text-input {
		width: 100%;
		background: var(--bg-primary);
		border: 1px solid var(--field-border);
		border-radius: 8px;
		padding: 8px 12px;
		font-size: 13px;
		color: var(--text-primary);
		outline: none;
		font-family: inherit;
		transition: border-color 0.15s;
		box-sizing: border-box;
	}
	.text-input:focus {
		border-color: var(--edit-btn);
	}
		.text-input.input-error {
		border-color: var(--error-color);
	}

	.field-error {
		font-size: 11px;
		color: var(--error-color);
		margin: 4px 0 0;
		line-height: 1.4;
	}
	/* ── Ticket mode chips ── */
	.mode-chips {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.mode-chip {
		font-size: 12px;
		padding: 5px 14px;
		border-radius: 20px;
		border: 1px solid var(--border);
		background: var(--bg-primary);
		color: var(--text-muted);
		cursor: pointer;
		transition:
			background 0.12s,
			color 0.12s,
			border-color 0.12s;
	}
	.mode-chip.selected {
		background: var(--edit-btn);
		border-color: var(--edit-btn);
		color: #fff;
		font-weight: 500;
	}

	/* ── Action bar ── */
	.action-bar {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 14px 20px;
		border-top: 1px solid var(--border);
		background: var(--bg-primary);
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		height: 40px;
		border-radius: 12px;
		border: 1px solid var(--border);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		width: 100%;
		transition:
			background 0.15s,
			opacity 0.15s;
	}
	.action-btn i {
		font-size: 14px;
	}
	.action-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.create-btn {
		background: var(--edit-btn);
		border-color: var(--edit-btn);
		color: #fff;
	}
	.create-btn:not(:disabled):hover {
		opacity: 0.9;
	}

	.generate-error {
		font-size: 12px;
		color: var(--error-color);
		text-align: center;
	}
</style>
