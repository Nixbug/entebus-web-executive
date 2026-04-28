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

	function serviceListingpage() {
		history.back();
	}
</script>

<aside class="panel">
	<!-- Header -->
	<div class="panel-header">
		<button class="back-btn" on:click={serviceListingpage}>
			<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M10 12L6 8l4-4" />
			</svg>
			Service list
		</button>

		<p class="service-id">Service #{service.id}</p>

		<div class="title-row">
			<h1 class="service-title">{routeLabel}</h1>
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
					<svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="#185FA5"
						stroke-width="1.5"
					>
						<rect x="1" y="5" width="14" height="8" rx="2" />
						<path d="M4 5V4a1 1 0 011-1h6a1 1 0 011 1v1" />
						<circle cx="4.5" cy="13" r="1.5" fill="#185FA5" stroke="none" />
						<circle cx="11.5" cy="13" r="1.5" fill="#185FA5" stroke="none" />
					</svg>
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
					<svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="#0F6E56"
						stroke-width="1.5"
					>
						<circle cx="3" cy="4" r="2" />
						<circle cx="13" cy="12" r="2" />
						<path d="M3 6v3a4 4 0 004 4h2" />
					</svg>
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
					<svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="#854F0B"
						stroke-width="1.5"
					>
						<rect x="2" y="3" width="12" height="10" rx="1.5" />
						<path d="M8 6v4M6.5 7.5h2a.5.5 0 010 1H7a.5.5 0 000 1h2" />
					</svg>
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
					<svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="#534AB7"
						stroke-width="1.5"
					>
						<rect x="1" y="5" width="14" height="6" rx="1" />
						<path d="M5 5V4M11 5V4M5 11v1M11 11v1" />
					</svg>
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
</aside>

<style>
	.panel {
		background: var(--bg-card);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	/* ── Header ── */
	.panel-header {
		padding: 20px 20px 16px;
		border-bottom: 1px solid var(--border);
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 12px;
		color: var(--text-muted);
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		margin-bottom: 14px;
	}

	.back-btn svg {
		width: 14px;
		height: 14px;
	}

	.back-btn:hover {
		color: var(--text-primary);
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

	.field-icon {
		width: 30px;
		height: 30px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
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

	.remark-text {
		font-size: 13px;
		line-height: 1.45;
		color: var(--text-primary);
		white-space: pre-wrap;
	}

	.remark-empty {
		color: var(--text-muted);
	}

</style>
