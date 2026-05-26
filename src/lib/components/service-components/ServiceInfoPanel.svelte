<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';
	import SearchableDropdown from '$lib/components/SearchableDropdown.svelte';
	import TimeSelector from '$lib/components/route-components/TimeSelector.svelte';
	import {
		SERVICE_TICKET_MODE_LABEL_BY_VALUE,
		SERVICE_STATUS,
		SERVICE_STATUS_LABEL_BY_VALUE
	} from '$lib/constants';
	import { canUpdateService, canDeleteService } from '$lib/utils/permissions';
	import { fetchLandmarkInRoute, fetchRoute } from '$lib/services/route-landmarks';
	import { fetchFareList } from '$lib/services/dynamic-fare';
	import { fetchLandmarkList } from '$lib/services/landmark';
	import { mapServiceStatusToLabel } from '$lib/helpers';
	import { goto } from '$app/navigation';
	import type {
		ServiceDetail,
		Landmark,
		ServiceRouteStop,
		LandmarkMap,
		ServiceFare,
		TimeSelection
	} from '$lib/types/type';

	//-- Props --
	export let service: ServiceDetail;
	export let landmarks: Landmark[] = [];
	export let companyId: string | null = null;
	export let companyName: string | null = null;
	export let companyStatus: string | null = null;
	export let referrerFromDate: string | null = null;
	export let referrerToDate: string | null = null;
	export let isFromReport: boolean = false;
	export let loadVehicles:
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

	//-- Aggregated collection value (from duties) — optional
	export let totalCollection: number | null = null;

	const dispatch = createEventDispatcher<{
		preview: {
			route: ServiceRouteStop[];
			landmarkMap: LandmarkMap;
			fare: ServiceFare | null;
			loading?: boolean;
		};
		update: { payload: Record<string, any> };
		delete: void;
		cancel: void;
	}>();

	$: canUpdate = canUpdateService();
	$: canDelete = canDeleteService();
	$: canDeleteNow = canDelete && service.status === SERVICE_STATUS.CREATED;
	$: isCreatedStatus = service.status === SERVICE_STATUS.CREATED;

	//-- Derived static display values --
	$: startLandmark = landmarks.find((l) => l.apiId === service?.startingLandmarkId);
	$: endLandmark = landmarks.find((l) => l.apiId === service?.endingLandmarkId);
	$: routeLabel =
		startLandmark && endLandmark
			? `${capitalize(startLandmark.name)} → ${capitalize(endLandmark.name)}`
			: `Landmark #${service?.startingLandmarkId ?? '?'} → Landmark #${service?.endingLandmarkId ?? '?'}`;
	$: statusLabel =
		mapServiceStatusToLabel(service?.status) ||
		(service?.status == null ? '—' : String(service.status));

	function capitalize(str: string): string {
		if (!str) return '';
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	//-- UTC ISO → IST date + time strings --
	function isoToIst(isoStr: string): { date: string; time: string } {
		const d = new Date(isoStr);
		const istMs = d.getTime() + (5 * 60 + 30) * 60 * 1000;
		const ist = new Date(istMs);
		return {
			date: `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`,
			time: `${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`
		};
	}

	function formatCurrency(n: number): string {
		try {
			return n.toLocaleString('en-IN', {
				style: 'currency',
				currency: 'INR',
				maximumFractionDigits: 2
			});
		} catch (e) {
			return String(n);
		}
	}

	//-- Editable state and original baseline, kept in sync with service --
	let selectedVehicleId = '';
	let selectedFareId = '';
	let selectedRouteId: string = ''; // '' = no new route; filled when user picks a new one
	let selectedTicketMode = 0;
	let selectedStatus = 0;
	let remark = '';
	let startingDate = '';
	let startingTime = '';
	let serviceName = '';
	let nameError = '';

	const NAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9 _.-]*[A-Za-z0-9])?$/;

	function validateName(value: string): string {
		if (!value) return '';
		if (!NAME_PATTERN.test(value)) {
			return 'Service name must start and end with alphanumeric characters, and can contain spaces, underscores, dots, or dashes.';
		}
		return '';
	}

	$: nameError = validateName(serviceName);
	$: nameChanged = serviceName !== origName;

	//-- Original values for dirty detection — reactive, synced with service --
	let origVehicleId = '';
	let origFareId = '';
	let origTicketMode = 0;
	let origStatus = 0;
	let origRemark = '';
	let origDate = '';
	let origTime = '';
	let origName = '';

	//-- Capture service form state as a snapshot string --
	function getServiceFormSnapshot(): string {
		return JSON.stringify({
			name: service.name,
			vehicleId: String(service.vehicle.vehicleId),
			fareId: String(service.fare.fareId),
			ticketMode: service.ticketMode,
			status: service.status,
			remark: service.remark ?? '',
			startingAt: service.startingAt,
			startingLandmarkId: service.startingLandmarkId,
			endingLandmarkId: service.endingLandmarkId
		});
	}

	//-- Sync form state from service, resetting dirty detection baseline --
	function syncFormStateFromService() {
		const _initIst = isoToIst(service.startingAt);
		serviceName = service.name;
		selectedVehicleId = String(service.vehicle.vehicleId);
		selectedFareId = String(service.fare.fareId);
		selectedRouteId = '';
		selectedTicketMode = service.ticketMode;
		selectedStatus = service.status;
		remark = service.remark ?? '';
		startingDate = _initIst.date;
		startingTime = _initIst.time;

		//-- Reset baseline to match current state --
		origName = serviceName;
		origVehicleId = selectedVehicleId;
		origFareId = selectedFareId;
		origTicketMode = selectedTicketMode;
		origStatus = selectedStatus;
		origRemark = remark;
		origDate = startingDate;
		origTime = startingTime;
	}

	//-- Watch service changes and re-sync form state --
	let lastServiceFormSnapshot = '';
	$: {
		const nextServiceFormSnapshot = getServiceFormSnapshot();
		if (nextServiceFormSnapshot !== lastServiceFormSnapshot) {
			lastServiceFormSnapshot = nextServiceFormSnapshot;
			syncFormStateFromService();
		}
	}

	//-- Allowed status transitions --
	const STATUS_TRANSITIONS: Record<number, number[]> = {
		[SERVICE_STATUS.CREATED]: [],
		[SERVICE_STATUS.DOWNLOADED]: [SERVICE_STATUS.ENDED],
		[SERVICE_STATUS.STARTED]: [SERVICE_STATUS.ENDED],
		[SERVICE_STATUS.ENDED]: [SERVICE_STATUS.STARTED],
		[SERVICE_STATUS.AUDITED]: []
	};
	$: statusOptions = [service.status, ...(STATUS_TRANSITIONS[service.status] ?? [])].map((v) => ({
		value: v,
		label:
			SERVICE_STATUS_LABEL_BY_VALUE[v as keyof typeof SERVICE_STATUS_LABEL_BY_VALUE] ?? String(v)
	}));

	$: isDirty =
		serviceName !== origName ||
		selectedVehicleId !== origVehicleId ||
		selectedFareId !== origFareId ||
		!!selectedRouteId ||
		selectedTicketMode !== origTicketMode ||
		selectedStatus !== origStatus ||
		remark.trim() !== origRemark.trim() ||
		startingTime !== origTime ||
		startingDate !== origDate;

	//-- TimeSelector two-way sync --
	let timeSelection: TimeSelection = { days: 1, hours: 0, minutes: 0, period: 'AM' };
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
		let h = (val.hours ?? 0) % 12;
		if (val.period === 'PM') h += 12;
		if (val.period === 'AM' && h === 12) h = 0;
		startingTime = `${String(h).padStart(2, '0')}:${String(val.minutes).padStart(2, '0')}`;
		timeSelection = val;
		isUpdatingFromTimeSelector = false;
		triggerTimeline();
	}

	//-- Ticket mode options --
	const ticketModeOptions = Object.entries(SERVICE_TICKET_MODE_LABEL_BY_VALUE).map(
		([val, label]) => ({ value: Number(val), label })
	);

	//-- Timeline generation --
	let generating = false;
	let generateError: string | null = null;
	let autoGenerateTimer: number | null = null;
	const AUTO_GENERATE_DEBOUNCE_MS = 400;
	let latestGenId = 0;
	let pendingGenerate = false;
	//-- Incremented by user actions; reactive block only fires when > 0 (never on first render) --
	let timelineTrigger = 0;

	function triggerTimeline() {
		timelineTrigger++;
	}

	function scheduleAutoGenerate() {
		if (autoGenerateTimer) {
			clearTimeout(autoGenerateTimer as any);
			autoGenerateTimer = null;
		}
		if (generating) {
			pendingGenerate = true;
			return;
		}
		autoGenerateTimer = window.setTimeout(() => {
			if (generating) {
				pendingGenerate = true;
			} else {
				handleGenerate();
			}
			autoGenerateTimer = null;
		}, AUTO_GENERATE_DEBOUNCE_MS);
	}

	//-- Fire only when user explicitly triggers via triggerTimeline() --
	$: if (timelineTrigger > 0) {
		if (selectedFareId) {
			dispatch('preview', { route: [], landmarkMap: {}, fare: null, loading: true });
			scheduleAutoGenerate();
		} else {
			generateError = null;
			dispatch('preview', { route: [], landmarkMap: {}, fare: null });
		}
	}

	function deltaToIso(startTimeUtc: string, deltaMinutes: number, dateStr: string): string {
		if (startTimeUtc.includes('T')) {
			const base = new Date(startTimeUtc);
			base.setMinutes(base.getMinutes() + deltaMinutes);
			return base.toISOString();
		}
		const match = startTimeUtc.match(/^(\d{1,2}):(\d{2})(?::\d+)?Z?$/);
		if (!match) throw new Error(`Invalid route start time format: ${startTimeUtc}`);
		const base = new Date(
			`${dateStr}T${String(parseInt(match[1])).padStart(2, '0')}:${String(parseInt(match[2])).padStart(2, '0')}:00Z`
		);
		base.setMinutes(base.getMinutes() + deltaMinutes);
		return base.toISOString();
	}

	async function handleGenerate() {
		if (!selectedFareId) return;
		generating = true;
		generateError = null;
		const myGenId = ++latestGenId;
		try {
			const [hStr, mStr] = startingTime.split(':');
			const [y, mo, d] = startingDate.split('-').map(Number);
			const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
			const newStartMs = Date.UTC(y, (mo ?? 1) - 1, d, Number(hStr), Number(mStr)) - istOffsetMs;

			let stops: ServiceRouteStop[];
			let landmarkMap: LandmarkMap;

			if (selectedRouteId) {
				// New route selected → fetch stops from API
				const rawLandmarksInRoute: any[] = await fetchLandmarkInRoute({
					route_id: Number(selectedRouteId),
					limit: 100
				});
				if (!Array.isArray(rawLandmarksInRoute) || rawLandmarksInRoute.length === 0)
					throw new Error('Selected route has no stops configured.');

				const routeStartTimeUtc = new Date(newStartMs).toISOString();
				const sorted = [...rawLandmarksInRoute].sort(
					(a, b) => (a.distance_from_start ?? 0) - (b.distance_from_start ?? 0)
				);
				stops = sorted.map((rl: any) => ({
					serviceId: service.id,
					landmarkId: Number(rl.landmark_id),
					arrivalAt: deltaToIso(routeStartTimeUtc, Number(rl.arrival_delta ?? 0), startingDate),
					departureAt: deltaToIso(routeStartTimeUtc, Number(rl.departure_delta ?? 0), startingDate),
					distanceFromStart: Number(rl.distance_from_start ?? 0)
				}));
				const landmarkIds = sorted.map((rl: any) => Number(rl.landmark_id));
				const rawLandmarks: any[] = await fetchLandmarkList({ id_list: landmarkIds, limit: 100 });
				landmarkMap = {};
				rawLandmarks.forEach((raw: any) => {
					const apiId = Number(raw.id);
					landmarkMap[apiId] = {
						id: String(raw.id),
						apiId,
						name: raw.name ?? '',
						boundary: raw.boundary ?? '',
						type: String(raw.type ?? ''),
						createdAt: raw.created_on,
						updatedAt: raw.updated_on ?? undefined
					};
				});
			} else {
				// No new route → shift existing stop times to new start time
				const origStartMs = new Date(service.startingAt).getTime();
				stops = service.route.map((stop) => ({
					serviceId: stop.serviceId,
					landmarkId: stop.landmarkId,
					arrivalAt: new Date(
						newStartMs + (new Date(stop.arrivalAt).getTime() - origStartMs)
					).toISOString(),
					departureAt: new Date(
						newStartMs + (new Date(stop.departureAt).getTime() - origStartMs)
					).toISOString(),
					distanceFromStart: stop.distanceFromStart
				}));
				landmarkMap = landmarks.reduce<LandmarkMap>((acc, l) => {
					if (l.apiId != null) acc[l.apiId] = l;
					return acc;
				}, {});
			}

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

			if (myGenId !== latestGenId) return;
			dispatch('preview', { route: stops, landmarkMap, fare });
		} catch (err) {
			if (myGenId !== latestGenId) return;
			generateError = (err as Error).message;
			dispatch('preview', { route: [], landmarkMap: {}, fare: null, loading: false });
		} finally {
			generating = false;
			if (pendingGenerate) {
				pendingGenerate = false;
				handleGenerate();
			}
		}
	}

	async function loadRoutesForDropdown(
		q?: string,
		limit?: number,
		offset?: number
	): Promise<Array<{ id: number; name: string }>> {
		const resolvedCompanyId =
			companyId != null && companyId !== ''
				? Number(companyId)
				: service?.companyId != null
					? Number(service.companyId)
					: undefined;
		const result = await fetchRoute({
			search: q,
			limit: limit ?? 10,
			offset: offset ?? 0,
			company_id: resolvedCompanyId,
			status: 1
		});
		if (!Array.isArray(result)) return [];
		return result.map((r: any) => ({ id: Number(r.id), name: String(r.name) }));
	}

	onDestroy(() => {
		if (autoGenerateTimer) {
			clearTimeout(autoGenerateTimer as any);
			autoGenerateTimer = null;
		}
	});

	//-- Date helpers (for Today/Tomorrow chips) -- IST-aware
	function todayDateString(): string {
		const nowUtc = new Date();
		const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
		const nowIst = new Date(nowUtc.getTime() + istOffsetMs);
		return `${nowIst.getUTCFullYear()}-${String(nowIst.getUTCMonth() + 1).padStart(2, '0')}-${String(nowIst.getUTCDate()).padStart(2, '0')}`;
	}
	function addDays(dateStr: string, days: number): string {
		const [y, m, d] = dateStr.split('-').map(Number);
		const dt = new Date(y, (m ?? 1) - 1, d + days);
		return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
	}
	$: dateToday = todayDateString();
	$: dateTomorrow = addDays(dateToday, 1);

	//-- Cancel: reset all fields to original, restore timeline via event --
	function handleCancel() {
		//-- Clear any pending auto-generate and invalidate in-flight requests --
		if (autoGenerateTimer) {
			clearTimeout(autoGenerateTimer as any);
			autoGenerateTimer = null;
		}
		latestGenId++;

		serviceName = origName;
		selectedVehicleId = origVehicleId;
		selectedFareId = origFareId;
		selectedRouteId = '';
		selectedTicketMode = origTicketMode;
		selectedStatus = origStatus;
		remark = origRemark;
		startingDate = origDate;
		startingTime = origTime;
		generateError = null;
		dispatch('cancel');
	}

	//-- Save: send only API-supported fields --
	function handleSave() {
		if (nameError) {
			return;
		}
		//-- Convert IST date/time back to ISO without using the browser's local timezone --
		const [year, month, day] = startingDate.split('-').map(Number);
		const [hour, minute] = startingTime.split(':').map(Number);
		const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
		const utcMs = Date.UTC(year, (month ?? 1) - 1, day, hour ?? 0, minute ?? 0, 0) - istOffsetMs;
		const startingAtIso = new Date(utcMs).toISOString();

		dispatch('update', {
			payload: {
				name: serviceName,
				ticket_mode: selectedTicketMode,
				status: selectedStatus,
				remark: remark.trim() || null,
				vehicle_id: selectedVehicleId ? Number(selectedVehicleId) : undefined,
				route_id: selectedRouteId ? Number(selectedRouteId) : undefined,
				fare_id: selectedFareId ? Number(selectedFareId) : undefined,
				starting_at: startingAtIso
			}
		});
	}

	function showDuties() {
		const params = new URLSearchParams();
		params.set('serviceId', String(service.id));
		params.set('serviceName', service.name);
		if (companyId) params.set('companyId', companyId);
		if (companyName) params.set('name', companyName);
		if (companyStatus) params.set('status', companyStatus);
		if (referrerFromDate) params.set('from_date', referrerFromDate);
		if (referrerToDate) params.set('to_date', referrerToDate);
		// Signal to duty page that it came from a report context
		if (isFromReport) params.set('referrer', 'report');
		goto(`/company/company-services/duty?${params.toString()}`);
	}
</script>

<aside class="panel">
	<!-- Header -->
	<div class="panel-header">
		<div class="header-top-row">
			<p class="service-id">Service #{service.id}</p>
			<button class="duties-btn" type="button" on:click={showDuties}>
				<i class="bi bi-list-task"></i>
				View duties
			</button>
		</div>
		<div class="title-row">
			<h1 class="service-title">{service.name}</h1>
			<div class="meta-right">
				<span class="status-badge">{statusLabel}</span>
				{#if service.status === SERVICE_STATUS.ENDED && totalCollection != null}
					<div class="collection-badge" title="Total collection from duties">
						<div class="collection-badge-label">Collection</div>
						<div class="collection-badge-value">{formatCurrency(totalCollection)}</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Editable fields -->
	<div class="fields">
		<!--service name field with existing value also editable-->
		<div class="field-group">
			<p class="field-label">
				<span class="ficon icon-name">
					<i class="bi bi-pencil" aria-hidden="true" style="color:#534AB7"></i>
				</span>
				Service name
			</p>
			<input
				type="text"
				class="text-input"
				class:input-error={nameChanged && nameError}
				bind:value={serviceName}
				disabled={!isCreatedStatus}
				placeholder="Enter service name"
			/>
			{#if nameChanged && nameError}
				<p class="field-error">{nameError}</p>
			{/if}
		</div>
		<!-- Vehicle -->
		<div class="field-group">
			<p class="field-label">
				<span class="ficon icon-vehicle">
					<i class="bi bi-truck" aria-hidden="true" style="color:#185FA5"></i>
				</span>
				Vehicle
			</p>
			<SearchableDropdown
				placeholder="Search vehicles…"
				loadOptions={loadVehicles ?? (() => Promise.resolve([]))}
				value={selectedVehicleId}
				initialLabel={service.vehicle.registrationNumber
					? `${service.vehicle.name}(${service.vehicle.registrationNumber})`
					: service.vehicle.name}
				disabled={!isCreatedStatus}
				disabledMessage="Not allowed - only services in Created status can change vehicle"
				onChange={(v) => {
					selectedVehicleId = v;
				}}
			/>
		</div>

		<!-- Route -->
		<div class="field-group">
			<p class="field-label">
				<span class="ficon icon-route">
					<i class="bi bi-signpost-split" aria-hidden="true" style="color:#0F6E56"></i>
				</span>
				Route
			</p>
			<SearchableDropdown
				placeholder="Search routes…"
				loadOptions={loadRoutesForDropdown}
				value={selectedRouteId}
				initialLabel={routeLabel}
				disabled={!isCreatedStatus}
				disabledMessage="Not allowed - only services in Created status can change route"
				onChange={(v) => {
					selectedRouteId = v;
					triggerTimeline();
				}}
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
				initialLabel={service.fare.name}
				disabled={!isCreatedStatus}
				disabledMessage="Not allowed - only services in Created status can change fare"
				onChange={(v) => {
					selectedFareId = v;
					triggerTimeline();
				}}
			/>
		</div>

		<!-- Starting at -->
		<div class="field-group">
			<p class="field-label">
				<span class="ficon icon-time">
					<i class="bi bi-clock" aria-hidden="true" style="color:#2a5298"></i>
				</span>
				Starting at <span class="hint">(IST · for timeline preview)</span>
			</p>
			<div class="datetime-row" class:disabled-section={!isCreatedStatus}>
				<div class="date-options">
					<button
						type="button"
						class="date-chip"
						class:selected={startingDate === dateToday}
						disabled={!isCreatedStatus}
						title={!isCreatedStatus
							? 'Not allowed - only services in Created status can change start date/time'
							: undefined}
						on:click={() => {
							startingDate = dateToday;
							triggerTimeline();
						}}
					>
						<span class="date-label">Today</span>
						<span class="date-sub"
							>{new Date(dateToday + 'T00:00:00').toLocaleDateString(undefined, {
								month: 'short',
								day: 'numeric'
							})}</span
						>
					</button>
					<button
						type="button"
						class="date-chip"
						class:selected={startingDate === dateTomorrow}
						disabled={!isCreatedStatus}
						title={!isCreatedStatus
							? 'Not allowed - only services in Created status can change start date/time'
							: undefined}
						on:click={() => {
							startingDate = dateTomorrow;
							triggerTimeline();
						}}
					>
						<span class="date-label">Tomorrow</span>
						<span class="date-sub"
							>{new Date(dateTomorrow + 'T00:00:00').toLocaleDateString(undefined, {
								month: 'short',
								day: 'numeric'
							})}</span
						>
					</button>
					{#if startingDate !== dateToday && startingDate !== dateTomorrow}
						<button
							type="button"
							class="date-chip selected"
							disabled={!isCreatedStatus}
							title={!isCreatedStatus
								? 'Not allowed - only services in Created status can change start date/time'
								: undefined}
							on:click={() => {}}
						>
							<span class="date-label">Service date</span>
							<span class="date-sub"
								>{new Date(startingDate + 'T00:00:00').toLocaleDateString(undefined, {
									month: 'short',
									day: 'numeric'
								})}</span
							>
						</button>
					{/if}
				</div>
			</div>
			<div
				class="time-selector-row"
				class:disabled-section={!isCreatedStatus}
				title={!isCreatedStatus
					? 'Not allowed - only services in Created status can change start date/time'
					: undefined}
			>
				<TimeSelector
					bind:value={timeSelection}
					showDays={false}
					on:change={(e) => handleTimeSelectorChange(e.detail)}
				/>
			</div>
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

		<!-- Status -->
		<div class="field-group">
			<p class="field-label">
				<span class="ficon icon-mode" style="background:#e8f4fd">
					<i class="bi bi-circle-half" aria-hidden="true" style="color:#0d6efd"></i>
				</span>
				Status
			</p>
			<div class="mode-chips">
				{#each statusOptions as opt}
					<button
						type="button"
						class="mode-chip"
						class:selected={selectedStatus === opt.value}
						on:click={() => (selectedStatus = opt.value)}>{opt.label}</button
					>
				{/each}
			</div>
		</div>

		<!-- Remark -->
		<div class="field-group">
			<p class="field-label">
				<span class="ficon icon-remark">
					<i class="bi bi-chat-left-text" aria-hidden="true" style="color:#4a5568"></i>
				</span>
				Remark <span class="hint">(optional)</span>
			</p>
			<textarea
				class="text-input remark-input"
				placeholder="Add a note about this service…"
				rows="3"
				bind:value={remark}
			></textarea>
		</div>
	</div>

	<!-- Action bar -->
	<div class="action-bar" class:is-dirty={isDirty}>
		{#if isDirty}
			<button class="action-btn cancel-btn" type="button" on:click={handleCancel}>
				<i class="bi bi-x-lg"></i>
				Cancel
			</button>
			<button
				class="action-btn save-btn"
				type="button"
				disabled={!canUpdate || !!nameError}
				title={nameError
					? nameError
					: !canUpdate
						? 'You do not have permission to update this service'
						: undefined}
				on:click={handleSave}
			>
				<i class="bi bi-check2"></i>
				Save Changes
			</button>
		{:else}
			<button
				class="action-btn delete-btn"
				type="button"
				disabled={!canDeleteNow}
				title={!canDelete
					? 'You do not have permission to delete this service'
					: service.status !== SERVICE_STATUS.CREATED
						? 'Only services in Created status can be deleted'
						: undefined}
				on:click={() => dispatch('delete')}
			>
				<i class="bi bi-trash3"></i>
				Delete
			</button>
		{/if}
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

	.header-top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 4px;
	}

	.service-id {
		font-size: 11px;
		color: var(--text-muted);
		margin: 0;
	}

	.duties-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 12px;
		font-weight: 600;
		padding: 4px 10px;
		border-radius: 8px;
		border: 1px solid var(--edit-btn);
		background: var(--edit-btn);
		color: #fff;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.duties-btn:hover {
		opacity: 0.9;
	}

	.duties-btn i {
		font-size: 13px;
	}
	.meta-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8px;
		min-width: 120px;
	}

	.collection-badge {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		background: var(--bg-primary);
		border: 1px solid var(--border);
		padding: 6px 10px;
		border-radius: 10px;
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
	}

	.collection-badge-label {
		font-size: 11px;
		color: var(--text-muted);
	}

	.collection-badge-value {
		font-size: 14px;
		font-weight: 700;
		color: var(--text-primary);
	}
	.title-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
	}

	.service-title {
		font-size: 15px;
		font-weight: 500;
		color: var(--text-primary);
		line-height: 1.45;
		flex: 1;
	}

	.status-badge {
		font-size: 11px;
		font-weight: 500;
		padding: 3px 10px;
		border-radius: 20px;
		background: var(--bg-primary);
		color: var(--text-muted);
		border: 1px solid var(--border);
		white-space: nowrap;
		flex-shrink: 0;
		margin-top: 2px;
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
	.icon-remark {
		background: #f0f0f0;
	}

	/* ── Date + time row ── */
	.datetime-row {
		margin-bottom: 0.5rem;
	}

	.date-options {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
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
		opacity: 0.45;
		transition:
			opacity 0.12s,
			transform 0.12s;
	}

	.date-chip:hover {
		opacity: 0.75;
		transform: translateY(-1px);
	}

	.date-chip:disabled:hover,
	.date-chip[disabled]:hover {
		opacity: 0.45;
		transform: none;
		border-color: var(--delete-btn, #dc3545);
		background: rgba(220, 53, 69, 0.08);
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
		margin-top: 0.5rem;
	}
	.disabled-section {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.time-selector-row.disabled-section {
		pointer-events: none;
	}

	.date-chip:disabled,
	.date-chip[disabled] {
		opacity: 0.45;
		cursor: not-allowed;
		background: var(--bg-primary);
	}

	/* ── Ticket mode chips ── */
	.mode-chips {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.mode-chip {
		padding: 6px 14px;
		border-radius: 20px;
		border: 1px solid var(--border);
		background: var(--bg-primary);
		color: var(--text-muted);
		font-size: 12px;
		font-weight: 500;
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
	}

	/* ── Inputs ── */
	.text-input {
		width: 100%;
		background: var(--bg-primary);
		border: 1px solid var(--field-border, var(--border));
		border-radius: 8px;
		padding: 8px 12px;
		font-size: 13px;
		color: var(--text-primary);
		outline: none;
		box-sizing: border-box;
		font-family: inherit;
	}

	.text-input:focus {
		border-color: var(--edit-btn);
	}

	.remark-input {
		resize: vertical;
		min-height: 72px;
	}

	/* ── Action bar ── */
	.action-bar {
		display: grid;
		grid-template-columns: 1fr;
		gap: 10px;
		padding: 14px 20px;
		border-top: 1px solid var(--border);
		background: var(--bg-primary);
	}

	.action-bar.is-dirty {
		grid-template-columns: 1fr 1fr;
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
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.action-btn i {
		font-size: 14px;
	}

	.save-btn {
		background: var(--edit-btn);
		border-color: var(--edit-btn);
		color: #fff;
	}

	.save-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.cancel-btn {
		background: var(--bg-card);
		color: var(--text-primary);
	}

	.cancel-btn:hover {
		background: var(--bg-primary);
	}

	.delete-btn {
		background: var(--clear-btn-bg);
		border-color: var(--delete-btn);
		color: var(--delete-btn);
	}

	.delete-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.action-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.generate-error {
		grid-column: 1 / -1;
		font-size: 12px;
		color: var(--delete-btn, #dc3545);
		margin: 0;
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
</style>
