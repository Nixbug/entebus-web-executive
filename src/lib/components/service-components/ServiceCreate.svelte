<script lang="ts">
	//-- servicecreatePanel.svelte
	import { createEventDispatcher, onDestroy } from 'svelte';
	import SearchableDropdown from '$lib/components/SearchableDropdown.svelte';
	import { SERVICE_TICKET_MODE_LABEL_BY_VALUE } from '$lib/constants';
	import { fetchLandmarkInRoute } from '$lib/services/route-landmarks';
	import { fetchFareList } from '$lib/services/dynamic-fare';
	import { fetchLandmarkList } from '$lib/services/landmark';
	import type { ServiceRouteStop, LandmarkMap, ServiceFare, Landmark } from '$lib/types/type';
	import { parseStartingTime } from '$lib/helpers';
	import TimeSelector from '$lib/components/route-components/TimeSelector.svelte';

	// ── Loader fns from parent ──
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

	// ── Selected values ──
	let selectedRouteId: string | undefined = undefined;
	let selectedFareId: string | undefined = undefined;
	let selectedVehicleId: string | undefined = undefined;
	let selectedRouteName = '';
	let selectedFareName = '';
	let selectedVehicleName = '';

	// ── Text fields ──
	let name = '';
	let remark = '';

	// ── Starting at (date + time) ──
	// Store as separate fields for cleaner binding, combine on submit
	let startingDate = todayDateString();
	let startingTime = '06:00'; // HH:MM (24h, local)
	let userHasEditedTime = false;
	// For TimeSelector (12hr format)
	import type { TimeSelection } from '$lib/types/type';
	let timeSelection: TimeSelection = { days: 1, hours: 6, minutes: 0, period: 'AM' };

	// Sync timeSelection <-> startingTime without cycles
	let isUpdatingFromTimeSelector = false;
	let isUpdatingFromTime = false;

	$: if (!isUpdatingFromTimeSelector && startingTime) {
		isUpdatingFromTime = true;
		let [h, m] = startingTime.split(':').map(Number);
		let period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
		let hours12 = h % 12;
		if (hours12 === 0) hours12 = 12;
		timeSelection = { ...timeSelection, hours: hours12, minutes: m, period, days: 1 };
		isUpdatingFromTime = false;
	}

	function handleTimeSelectorChange(val: TimeSelection) {
		if (isUpdatingFromTime) return;
		isUpdatingFromTimeSelector = true;
		// mark that the user actively changed the time so defaults no longer overwrite
		userHasEditedTime = true;

		let h = (val.hours ?? 0) % 12;
		if (val.period === 'PM') h += 12;
		if (val.period === 'AM' && h === 12) h = 0;
		startingTime = `${String(h).padStart(2, '0')}:${String(val.minutes).padStart(2, '0')}`;
		timeSelection = val;
		isUpdatingFromTimeSelector = false;
	}

	// ── Ticket mode chips ──
	const ticketModeOptions = Object.entries(SERVICE_TICKET_MODE_LABEL_BY_VALUE).map(
		([val, label]) => ({
			value: Number(val),
			label
		})
	);
	let selectedTicketMode: number = ticketModeOptions[0]?.value ?? 1;

	// ── Generate state ──
	let generating = false;
	let generateError: string | null = null;

	// Auto-generate timer id for debouncing
	let autoGenerateTimer: number | null = null;
	const AUTO_GENERATE_DEBOUNCE_MS = 300;

	function scheduleAutoGenerate() {
		if (autoGenerateTimer) {
			clearTimeout(autoGenerateTimer as any);
			autoGenerateTimer = null;
		}

		autoGenerateTimer = window.setTimeout(() => {
			// avoid re-entrancy if already generating
			if (!generating) handleGenerate();
			autoGenerateTimer = null;
		}, AUTO_GENERATE_DEBOUNCE_MS);
	}

	// Enable Generate only when route + fare selected (vehicle not needed for timeline)
	$: canGenerate = !!selectedRouteId && !!selectedFareId;
	// Enable Create only when all required fields filled
	$: canCreate =
		!!selectedRouteId &&
		!!selectedFareId &&
		!!selectedVehicleId &&
		startingDate !== '' &&
		startingTime !== '';

	// IST = UTC+5:30
	const IST_OFFSET_MINUTES = 330;

	function todayDateString(): string {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	function addDaysToDateString(dateStr: string, days: number): string {
		const [y, m, d] = dateStr.split('-').map(Number);
		const dt = new Date(y, (m ?? 1) - 1, d + days);
		return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
			dt.getDate()
		).padStart(2, '0')}`;
	}

	// Date picker boundaries: only allow today and tomorrow
	$: dateMin = todayDateString();
	$: dateMax = addDaysToDateString(dateMin, 1);

	// Keep startingDate within allowed range
	$: if (startingDate) {
		if (startingDate < dateMin || startingDate > dateMax) {
			startingDate = dateMin;
		}
	}

	/**
	 * Convert route start_time ("HH:MM:SSZ" UTC) + delta (minutes) → ISO UTC string
	 * Uses the selected date as the calendar base.
	 *
	 * Pattern from route creation page:
	 *   parseStartingTime gives local minutes from midnight
	 *   delta is in minutes from the route backend
	 *   We add delta to the start time, then build an ISO string.
	 */
	function deltaToIso(startTimeUtc: string, deltaMinutes: number, dateStr: string): string {
		// If startTimeUtc is a full ISO instant (from local Date -> toISOString), use it directly
		if (startTimeUtc.includes('T')) {
			const base = new Date(startTimeUtc);
			base.setMinutes(base.getMinutes() + deltaMinutes);
			return base.toISOString();
		}

		// Otherwise startTimeUtc is expected as "HH:MM(:SS)Z" UTC time — build a UTC date using dateStr
		const match = startTimeUtc.match(/^(\d{1,2}):(\d{2})(?::\d+)?Z?$/);
		if (!match) return new Date().toISOString();

		const utcHours = parseInt(match[1]);
		const utcMinutes = parseInt(match[2]);

		const base = new Date(
			`${dateStr}T${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}:00Z`
		);
		base.setMinutes(base.getMinutes() + deltaMinutes);
		return base.toISOString();
	}

	async function handleGenerate() {
		if (!canGenerate) return;
		generating = true;
		generateError = null;

		try {
			// 1. Fetch landmarks in the selected route → get landmark_id, distance_from_start, arrival_delta, departure_delta
			const rawLandmarksInRoute: any[] = await fetchLandmarkInRoute({
				route_id: Number(selectedRouteId)
			});
			if (!Array.isArray(rawLandmarksInRoute) || rawLandmarksInRoute.length === 0) {
				throw new Error('Selected route has no stops configured.');
			}

			// 2. Get the route start_time — we need to call fetchRoutes for the selected route to get start_time.
			//    Since loadRoutes only returns {id, name}, we fetch fare list to get a fresh item.
			//    Better: fetch the landmark list after, but we already have start_time in the raw route list data.
			//    The route list response includes start_time — but our loadRoutes strips it.
			//    So we call it directly with ID filter:
			let routeStartTimeUtc = '00:00:00Z';
			if (loadRoutes) {
				// Fetch with the name/id so we get a fresh result and extract start_time from raw
				// We need to get the route detail. Since we only have loadRoutes (returns {id,name}),
				// call fetchLandmarksInRoute which is from the same service file and we can also
				// import fetchRouteList directly here:
			}
			// fetchLandmarksInRoute returns route-landmark rows which don't include start_time.
			// We call a direct route detail fetch via fetchRouteDetail if available.
			// If the user changed the starting time manually, use that local time as the base
			// (convert local IST -> UTC) before applying deltas; otherwise use the route's UTC start_time.
			function localTimeToUtcTimeStr(localTime: string): string {
				const match = localTime.match(/^(\d{1,2}):(\d{2})$/);
				if (!match) return '00:00:00Z';
				let h = parseInt(match[1]);
				let m = parseInt(match[2]);
				// localTime is in IST — subtract IST offset to get UTC
				let totalMinutes = h * 60 + m - IST_OFFSET_MINUTES;
				totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;
				const utcH = Math.floor(totalMinutes / 60);
				const utcM = totalMinutes % 60;
				return `${String(utcH).padStart(2, '0')}:${String(utcM).padStart(2, '0')}:00Z`;
			}

			if (userHasEditedTime && startingTime) {
				const [hStr, mStr] = startingTime.split(':');
				const [y, mo, d] = startingDate.split('-').map(Number);
				const localDate = new Date(y, (mo ?? 1) - 1, d, Number(hStr), Number(mStr));
				routeStartTimeUtc = localDate.toISOString();
			} else {
				routeStartTimeUtc = selectedRouteStartTime || '00:00:00Z';
			}

			// 3. Sort landmarks by distance_from_start (same as route creation page)
			const sorted = [...rawLandmarksInRoute].sort(
				(a, b) => (a.distance_from_start ?? 0) - (b.distance_from_start ?? 0)
			);

			// 4. Build ServiceRouteStop[] — delta is in MINUTES from backend
			const routeStops: ServiceRouteStop[] = sorted.map((rl: any) => ({
				serviceId: 0,
				landmarkId: Number(rl.landmark_id),
				arrivalAt: deltaToIso(routeStartTimeUtc, Number(rl.arrival_delta ?? 0), startingDate),
				departureAt: deltaToIso(routeStartTimeUtc, Number(rl.departure_delta ?? 0), startingDate),
				distanceFromStart: Number(rl.distance_from_start ?? 0)
			}));

			// 5. Fetch landmark names
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

			// 6. Fetch full fare data (we need function + attributes for fare calculation)
			//    loadFares returns {id, name} only — we need to get attributes + function.
			//    Call fetchFareList with the selected ID so we get full data:
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
					extra: {}
				}
			};

			dispatch('preview', { route: routeStops, landmarkMap, fare });
		} catch (err) {
			generateError = (err as Error).message;
			console.error('Generate timeline failed:', err);
		} finally {
			generating = false;
		}
	}

	// Store the raw start_time when a route is selected so we can use it during generate
	let selectedRouteStartTime = '00:00:00Z';

	// We need a wrapper around loadRoutes that also captures start_time
	// The SearchableDropdown calls loadRoutes({id,name}) — we need the raw route data too.
	// Solution: expose a separate loader that also stores start_time on the side.
	async function loadRoutesWithMeta(
		q?: string,
		limit?: number,
		offset?: number
	): Promise<Array<{ id: number; name: string }>> {
		if (!loadRoutes) return [];
		// We fetch from loadRoutes which already calls fetchRoute internally.
		// To capture start_time we need to call fetchRoute directly here.
		// Import fetchRoute at top and call it:
		const { fetchRoute } = await import('$lib/services/route-landmarks');
		const companyIdParam =
			typeof window !== 'undefined'
				? new URLSearchParams(window.location.search).get('companyId')
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

		// Store the raw route list so we can retrieve start_time when a route is selected
		rawRouteList = result;

		return result.map((r: any) => ({ id: Number(r.id), name: String(r.name) }));
	}

	let rawRouteList: any[] = [];

	// When selectedRouteId changes, find start_time from rawRouteList
	// Convert UTC time string ("HH:MM:SSZ") to IST (add 5:30)
	function utcToIstTimeStr(utcTime: string): string {
		const match = utcTime.match(/^(\d{1,2}):(\d{2})/);
		if (!match) return '06:00';
		let h = parseInt(match[1]);
		let m = parseInt(match[2]);
		// Add 5 hours 30 minutes
		let totalMinutes = h * 60 + m + 330;
		totalMinutes = ((totalMinutes % 1440) + 1440) % 1440; // wrap around 24h
		const istH = Math.floor(totalMinutes / 60);
		const istM = totalMinutes % 60;
		return `${String(istH).padStart(2, '0')}:${String(istM).padStart(2, '0')}`;
	}

	$: if (selectedRouteId && rawRouteList.length > 0) {
		const found = rawRouteList.find((r: any) => String(r.id) === selectedRouteId);
		selectedRouteStartTime = found?.start_time ?? '00:00:00Z';
		// If user hasn't edited the time, set startingTime to the route's start_time (converted to IST)
		if (found?.start_time && !userHasEditedTime) {
			startingTime = utcToIstTimeStr(found.start_time);
		}
	}

	// Auto-generate timeline when route + fare + vehicle + start date/time are selected/changed
	// Debounced to avoid rapid repeated calls while the user is interacting.
	// Includes `startingDate` and `startingTime` so changes to start time refresh timeline.
	$: {
		const shouldAuto =
			!!selectedRouteId &&
			!!selectedFareId &&
			!!selectedVehicleId &&
			startingDate !== '' &&
			startingTime !== '';
		if (shouldAuto) {
			// Notify parent that generation is starting so it can show a loader
			dispatch('preview', { route: [], landmarkMap: {}, fare: null, loading: true });
			scheduleAutoGenerate();
		} else {
			// If any required selection is missing, clear the preview so timeline hides.
			dispatch('preview', { route: [], landmarkMap: {}, fare: null });
		}
	}

	onDestroy(() => {
		if (autoGenerateTimer) {
			clearTimeout(autoGenerateTimer as any);
			autoGenerateTimer = null;
		}
	});

	function handleCreate() {
		// Combine date + time → ISO UTC for starting_at
		// The time picker is local (IST), so convert to UTC
		const [hStr, mStr] = startingTime.split(':');
		// Build a local Date from selected calendar date + local time so JS computes UTC correctly.
		const [y, mo, d] = startingDate.split('-').map(Number);
		const localDate = new Date(y, (mo ?? 1) - 1, d, Number(hStr), Number(mStr));
		const startingAtIso = localDate.toISOString();

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
			<input class="text-input" type="text" placeholder="e.g. Morning Express" bind:value={name} />
		</div>

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
