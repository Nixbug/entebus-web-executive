<script lang="ts">
	//-- serviceinfopanel.svelte
	import type { ServiceDetail, Landmark } from '$lib/types/type';
	import {
		formatDistance,
		mapServiceStatusToLabel,
		mapServiceTicketModeToLabel,
		utcToIstFormat
	} from '$lib/helpers';

	export let service: ServiceDetail;
	export let landmarks: Landmark[] = [];
	let isEditing = false;

	$: startLandmark = landmarks.find((l) => l.apiId === service?.startingLandmarkId);
	$: endLandmark = landmarks.find((l) => l.apiId === service?.endingLandmarkId);

	$: routeLabel =
		startLandmark && endLandmark
			? `${capitalize(startLandmark.name)} → ${capitalize(endLandmark.name)}`
			: `Landmark #${service?.startingLandmarkId ?? '?'} → Landmark #${service?.endingLandmarkId ?? '?'}`;

	$: route = service?.route ?? [];
	$: totalDistance = route.length ? route[route.length - 1].distanceFromStart : 0;

	$: ticketTypes = service?.fare?.attributes?.ticket_types ?? [];
	$: ticketTypeNames = ticketTypes
		.map((ticketType) => ticketType.name)
		.filter(Boolean)
		.join(' / ');

	$: departureTime = formatIst(service?.startingAt);
	$: arrivalTime = formatIst(service?.endingAt);
	$: createdDate = formatIst(service?.createdOn);
	$: remarkText = service?.remark?.trim() || 'No remarks added yet';

	$: statusLabel =
		mapServiceStatusToLabel(service?.status) ||
		(service?.status == null ? '—' : String(service.status));
	$: ticketModeLabel =
		mapServiceTicketModeToLabel(service?.ticketMode) ||
		(service?.ticketMode == null ? '—' : String(service.ticketMode));

	function capitalize(str: string): string {
		if (!str) return '';
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	function formatIst(iso: string | null | undefined): string {
		return utcToIstFormat(iso) || '—';
	}

	function startEdit() {
		isEditing = true;
	}

	function saveEdit() {
		isEditing = false;
	}

	function cancelEdit() {
		isEditing = false;
	}
</script>

<aside class="panel">
	<!-- Header -->
	<div class="panel-header">
		<p class="service-id">Service #{service.id}</p>

		<div class="title-row">
			<h1 class="service-title">{service.name}</h1>
			<span class="status-badge">
				{statusLabel}
			</span>
		</div>
	</div>

	<!-- Fields -->
	<div class="fields">
		<!-- Vehicle -->
		<div class="field-group">
			<p class="field-label">Vehicle</p>
			<div class="field-value">
				<div class="field-icon icon-vehicle">
					<i class="bi bi-truck" aria-hidden="true" style="color:#185FA5"></i>
				</div>
				<div>
					<p class="value-main">{service.vehicle?.name ?? '—'}</p>
					<p class="value-sub">{service.registrationNumber}</p>
				</div>
			</div>
		</div>

		<!-- Route -->
		<div class="field-group">
			<p class="field-label">Route</p>
			<div class="field-value">
				<div class="field-icon icon-route">
					<i class="bi bi-signpost-split" aria-hidden="true" style="color:#0F6E56"></i>
				</div>
				<div>
					<p class="value-main">{routeLabel}</p>
					<p class="value-sub">{route.length} stops · {formatDistance(totalDistance)}</p>
				</div>
			</div>
		</div>

		<!-- Fare -->
		<div class="field-group">
			<p class="field-label">Fare plan</p>
			<div class="field-value">
				<div class="field-icon icon-fare">
					<i class="bi bi-wallet2" aria-hidden="true" style="color:#854F0B"></i>
				</div>
				<div>
					<p class="value-main">{service.fare?.name ?? '—'}</p>
					<p class="value-sub">{ticketTypeNames || '—'}</p>
				</div>
			</div>
		</div>

		<!-- Ticket mode -->
		<div class="field-group">
			<p class="field-label">Ticket mode</p>
			<div class="field-value">
				<div class="field-icon icon-mode">
					<i class="bi bi-ticket-detailed" aria-hidden="true" style="color:#534AB7"></i>
				</div>
				<p class="value-main">{ticketModeLabel}</p>
			</div>
		</div>

		<!-- Remark -->
		<div class="field-group">
			<p class="field-label">Remark</p>
			<p class="remark-text" class:remark-empty={!service?.remark?.trim()}>{remarkText}</p>
		</div>
	</div>

	<div class="action-bar">
		{#if isEditing}
			<button class="action-btn save-btn" type="button" on:click={saveEdit}>
				<i class="bi bi-check2"></i>
				Save
			</button>
			<button class="action-btn cancel-btn" type="button" on:click={cancelEdit}>
				<i class="bi bi-x-lg"></i>
				Cancel
			</button>
		{:else}
			<button class="action-btn edit-btn" type="button" on:click={startEdit}>
				<i class="bi bi-pencil-square"></i>
				Edit
			</button>
			<button class="action-btn delete-btn" type="button">
				<i class="bi bi-trash3"></i>
				Delete
			</button>
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

	.service-id {
		font-size: 11px;
		color: var(--text-muted);
		margin-bottom: 4px;
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
	}

	.field-group {
		padding: 13px 0;
		border-bottom: 1px solid var(--border);
	}

	.field-group:last-child {
		border-bottom: none;
	}

	.field-label {
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 7px;
	}

	.field-value {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	/* center the text column beside the icon */
	.field-value > div {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.field-icon {
		width: 30px;
		height: 30px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.field-icon i {
		font-size: 16px;
		line-height: 1;
		display: block;
	}

	/* icon backgrounds kept as fixed accent colors — they work in both modes */
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

	.value-main {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-primary);
	}

	.value-sub {
		font-size: 12px;
		color: var(--text-muted);
		margin-top: 1px;
	}

	/* remove default paragraph margins that can offset vertical centering */
	.value-main,
	.value-sub {
		margin: 0;
	}

	.remark-text {
		font-size: 13px;
		line-height: 1.45;
		color: var(--text-primary);
		white-space: pre-wrap;
	}

	.remark-empty {
		color: var(--text-muted);
	}

	.action-bar {
		display: grid;
		grid-template-columns: 1fr 1fr;
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
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.action-btn i {
		font-size: 14px;
	}

	.edit-btn,
	.save-btn {
		background: var(--edit-btn);
		border-color: var(--edit-btn);
		color: #fff;
	}

	.cancel-btn {
		background: var(--bg-card);
		color: var(--text-primary);
	}

	.delete-btn {
		background: var(--clear-btn-bg);
		border-color: var(--delete-btn);
		color: var(--delete-btn);
	}

	.action-btn:hover {
		opacity: 0.9;
	}
</style>
