<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import { fetchServiceList, fetchServiceDetail } from '$lib/services/company-services';
	import { fetchDutyList } from '$lib/services/service-duty';
	import { fetchOperatorAccount } from '$lib/services/operator-account';
	import { handleApiError } from '$lib/utils/api-error';
	import toast from '$lib/utils/toast';
	import { SERVICE_STATUS_LABEL_BY_VALUE } from '$lib/constants';
	import type { jsPDF as JsPdfDocument } from 'jspdf';
	import type { RowInput, UserOptions } from 'jspdf-autotable';

	//-- URL params (reactive) --
	$: rawIds = $page.url.searchParams.get('ids') ?? '';
	$: fromDate = $page.url.searchParams.get('from') ?? '';
	$: toDate = $page.url.searchParams.get('to') ?? '';

	//-- Company context (preserve when navigating between report pages) --
	$: companyId = $page.url.searchParams.get('companyId');
	$: companyName = $page.url.searchParams.get('name');
	$: companyStatus = $page.url.searchParams.get('status');

	//-- Build a safe return URL with company context preserved --
	$: backToReportUrl = (() => {
		const params = new URLSearchParams();
		if (fromDate) params.set('from', fromDate);
		if (toDate) params.set('to', toDate);
		if (companyId) params.set('companyId', companyId);
		if (companyName) params.set('name', companyName);
		if (companyStatus) params.set('status', companyStatus);
		const qs = params.toString();
		return `/company/service-report${qs ? `?${qs}` : ''}`;
	})();

	$: serviceIds = (rawIds ?? '')
		.split(',')
		.map((s) => parseInt(s.trim(), 10))
		.filter((n) => !isNaN(n)) as number[];

	// Trigger string that includes dates so reactive updates when any param changes
	let reportRequestId = 0;
	$: triggerReport = `${serviceIds.join(',')}|${fromDate}|${toDate}`;

	// Re-run the report whenever the selected service IDs or date range change.
	// Uses a request-id guard inside `loadReport()` to ignore stale responses
	// when query params change quickly.
	$: if (serviceIds.length > 0 && triggerReport) {
		loading = true;
		loadReport();
	}

	//-- State --
	interface ReportRow {
		id: number;
		name: string;
		registration_number: string;
		status: number;
		ticket_mode: number;
		vehicle_id: number | null;
		vehicle_name: string;
		starting_at: string;
		ending_at: string;
		total_collection: number;
		duty_count: number;
	}

	let rows: ReportRow[] = [];
	let loading = true;
	let generatedAt = '';
	let downloadingPdf = false;

	//-- Helpers --
	function statusLabel(status: number): string {
		return (SERVICE_STATUS_LABEL_BY_VALUE as Record<number, string>)[status] ?? String(status);
	}

	function statusColor(status: number): string {
		const map: Record<number, string> = {
			1: '#6c757d',
			2: '#0d6efd',
			3: '#198754',
			4: '#dc3545',
			5: '#6f42c1'
		};
		return map[status] ?? '#6c757d';
	}

	function ticketModeLabel(mode: number): string {
		const map: Record<number, string> = { 1: 'Hybrid', 2: 'Digital', 3: 'Conventional' };
		return map[mode] ?? String(mode);
	}

	function formatDate(iso: string | null | undefined): string {
		if (!iso) return 'N/A';
		const d = new Date(iso);
		if (isNaN(d.getTime())) return iso ?? 'N/A';
		return new Intl.DateTimeFormat('en-IN', {
			timeZone: 'Asia/Kolkata',
			year: 'numeric',
			month: 'short',
			day: '2-digit'
		}).format(d);
	}

	function formatDateTime(iso: string | null | undefined): string {
		if (!iso) return 'N/A';
		const d = new Date(iso);
		if (isNaN(d.getTime())) return iso ?? 'N/A';
		return new Intl.DateTimeFormat('en-IN', {
			timeZone: 'Asia/Kolkata',
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).format(d);
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 2
		}).format(amount);
	}

	function formatDisplayDate(date: string): string {
		if (!date) return 'N/A';
		const d = new Date(`${date}T00:00:00+05:30`);
		return new Intl.DateTimeFormat('en-IN', {
			timeZone: 'Asia/Kolkata',
			year: 'numeric',
			month: 'long',
			day: '2-digit'
		}).format(d);
	}

	//-- Operator-wise breakdown --
	interface OperatorRow {
		operator_id: number;
		name: string;
		duty_count: number;
		total_collection: number;
	}
	let operatorRows: OperatorRow[] = [];

	//-- Vehicle-wise breakdown --
	interface VehicleRow {
		vehicle_id: number | null;
		vehicle_name: string;
		registration_number: string;
		duty_count: number;
		total_collection: number;
	}
	let vehicleRows: VehicleRow[] = [];

	$: grandTotal = rows.reduce((sum, r) => sum + r.total_collection, 0);
	$: totalDuties = rows.reduce((sum, r) => sum + r.duty_count, 0);
	$: totalServices = rows.length;

	const PDF_MARGIN = {
		top: 34,
		right: 32,
		bottom: 42,
		left: 32
	};

	function formatPdfCurrency(amount: number): string {
		return `INR ${new Intl.NumberFormat('en-IN', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount)}`;
	}

	/**
	 * Scale a set of base column widths so their rounded integer widths sum to availWidth.
	 * Distributes any leftover pixels by fractional remainder (largest fractional parts first).
	 */
	function scaleColumnWidths(
		availWidth: number,
		baseWidths: Record<number, number>
	): Record<number, number> {
		// use an integer target so allocated widths never exceed table width
		const target = Math.floor(availWidth);
		const entries = Object.entries(baseWidths).map(([k, v]) => [k, Number(v)] as [string, number]);
		const total = entries.reduce((s, [, v]) => s + v, 0);
		if (total <= 0) return Object.fromEntries(entries.map(([k]) => [Number(k), 0]));

		const factor = target / total;
		const exacts = entries.map(([k, v]) => ({ k, exact: v * factor }));
		const floored = exacts.map(({ k, exact }) => [k, Math.floor(exact)] as [string, number]);
		let sumFloored = floored.reduce((s, [, v]) => s + v, 0);
		let remainder = target - sumFloored;
		if (remainder < 0) remainder = 0;

		// sort by fractional remainder descending so we give extra widths to largest fractions
		exacts.sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)));
		const result: Record<number, number> = {};
		for (const [k, v] of floored) result[Number(k)] = v;
		let idx = 0;
		while (remainder > 0 && exacts.length > 0) {
			const k = exacts[idx % exacts.length].k;
			result[Number(k)] = (result[Number(k)] || 0) + 1;
			remainder -= 1;
			idx += 1;
		}
		return result;
	}
	function sanitizePdfFilePart(value: string): string {
		return value
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	function pdfFileName(): string {
		const from = sanitizePdfFilePart(fromDate || 'from');
		const to = sanitizePdfFilePart(toDate || 'to');
		return `service-collection-report-${from}-${to}.pdf`;
	}

	function getLastTableY(doc: JsPdfDocument, fallback: number): number {
		const table = (doc as JsPdfDocument & { lastAutoTable?: { finalY?: number } }).lastAutoTable;
		return table?.finalY ?? fallback;
	}

	function ensurePdfSpace(doc: JsPdfDocument, y: number, requiredHeight: number): number {
		const pageHeight = doc.internal.pageSize.getHeight();
		if (y + requiredHeight <= pageHeight - PDF_MARGIN.bottom) return y;
		doc.addPage('a4', 'landscape');
		return PDF_MARGIN.top;
	}

	function addPdfHeader(doc: JsPdfDocument) {
		const pageWidth = doc.internal.pageSize.getWidth();
		const right = pageWidth - PDF_MARGIN.right;

		doc.setFont('helvetica', 'bold');
		doc.setFontSize(17);
		doc.setTextColor(22, 28, 38);
		doc.text('Service Collection Report', PDF_MARGIN.left, 38);

		doc.setFont('helvetica', 'normal');
		doc.setFontSize(9);
		doc.setTextColor(95, 105, 120);
		doc.text('Operator Service Report', PDF_MARGIN.left, 54);

		doc.setFontSize(8.5);
		doc.setTextColor(70, 78, 92);
		doc.text(`Period: ${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`, right, 34, {
			align: 'right'
		});
		doc.text(`Services: ${rows.length}`, right, 48, { align: 'right' });
		doc.text(`Generated: ${generatedAt}`, right, 62, { align: 'right' });

		doc.setDrawColor(220, 225, 232);
		doc.line(PDF_MARGIN.left, 72, right, 72);
	}

	function addPdfSectionTitle(doc: JsPdfDocument, title: string, y: number): number {
		const nextY = ensurePdfSpace(doc, y, 28);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(10.5);
		doc.setTextColor(25, 32, 44);
		doc.text(title, PDF_MARGIN.left, nextY);
		return nextY + 8;
	}

	function addPdfFooters(doc: JsPdfDocument) {
		const pageCount = doc.getNumberOfPages();
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();

		for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
			doc.setPage(pageNumber);
			doc.setDrawColor(225, 229, 235);
			doc.line(PDF_MARGIN.left, pageHeight - 28, pageWidth - PDF_MARGIN.right, pageHeight - 28);

			doc.setFont('helvetica', 'normal');
			doc.setFontSize(7.5);
			doc.setTextColor(110, 118, 132);
			doc.text('System-generated report. No signature required.', PDF_MARGIN.left, pageHeight - 15);
			doc.text(
				`Page ${pageNumber} of ${pageCount}`,
				pageWidth - PDF_MARGIN.right,
				pageHeight - 15,
				{
					align: 'right'
				}
			);
		}
	}

	const basePdfTableOptions: Partial<UserOptions> = {
		theme: 'grid',
		margin: PDF_MARGIN,
		showHead: 'everyPage',
		showFoot: 'lastPage',
		rowPageBreak: 'avoid',
		styles: {
			font: 'helvetica',
			fontSize: 7.2,
			cellPadding: { top: 3.5, right: 3.5, bottom: 3.5, left: 3.5 },
			overflow: 'linebreak',
			valign: 'middle',
			lineColor: [218, 224, 232],
			lineWidth: 0.35,
			textColor: [30, 38, 52],
			minCellHeight: 13
		},
		headStyles: {
			fillColor: [242, 245, 249],
			textColor: [78, 88, 104],
			fontStyle: 'bold',
			fontSize: 6.9
		},
		footStyles: {
			fillColor: [242, 245, 249],
			textColor: [22, 28, 38],
			fontStyle: 'bold',
			fontSize: 7.4
		},
		alternateRowStyles: {
			fillColor: [250, 251, 253]
		}
	};

	async function handleDownloadPdf() {
		if (downloadingPdf) return;
		downloadingPdf = true;

		try {
			const [{ jsPDF }, autoTableModule] = await Promise.all([
				import('jspdf'),
				import('jspdf-autotable')
			]);
			const autoTable = autoTableModule.default;
			const doc = new jsPDF({
				orientation: 'landscape',
				unit: 'pt',
				format: 'a4',
				compress: true
			});

			doc.setProperties({
				title: 'Service Collection Report',
				subject: `${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`
			});

			addPdfHeader(doc);

			{
				const availWidth = doc.internal.pageSize.getWidth() - PDF_MARGIN.left - PDF_MARGIN.right;
				const headerCols = { 0: 260, 1: 245, 2: 240 };
				const scaled = scaleColumnWidths(availWidth, headerCols);

				autoTable(doc, {
					...basePdfTableOptions,
					startY: 86,
					tableWidth: availWidth,
					body: [
						[
							{ content: `Grand Collection\n${formatPdfCurrency(grandTotal)}` },
							{ content: `Total Duties\n${totalDuties}` },
							{ content: `Total Services\n${rows.length}` }
						]
					],
					styles: {
						...(basePdfTableOptions.styles ?? {}),
						fontSize: 9,
						cellPadding: { top: 7, right: 8, bottom: 7, left: 8 },
						lineColor: [218, 224, 232]
					},
					bodyStyles: {
						fillColor: [248, 250, 252],
						textColor: [38, 48, 65],
						fontStyle: 'bold'
					},
					columnStyles: {
						0: { cellWidth: scaled[0], textColor: [20, 91, 158] },
						1: { cellWidth: scaled[1] },
						2: { cellWidth: scaled[2] }
					}
				});
			}

			let currentY = getLastTableY(doc, 126) + 24;
			currentY = addPdfSectionTitle(doc, 'Service-wise Breakdown', currentY);

			const serviceBody: RowInput[] = rows.map((row, i) => [
				i + 1,
				`#${row.id}`,
				row.name,
				row.registration_number,
				statusLabel(row.status),
				ticketModeLabel(row.ticket_mode),
				formatDateTime(row.starting_at),
				formatDateTime(row.ending_at),
				row.duty_count,
				row.total_collection > 0
					? formatPdfCurrency(row.total_collection)
					: row.duty_count === 0
						? 'N/A'
						: formatPdfCurrency(0)
			]);

			{
				const availWidth = doc.internal.pageSize.getWidth() - PDF_MARGIN.left - PDF_MARGIN.right;
				const s = {
					0: 26,
					1: 38,
					2: 142,
					3: 72,
					4: 58,
					5: 58,
					6: 100,
					7: 100,
					8: 42,
					9: 75
				};
				const scaled = scaleColumnWidths(availWidth, s);

				autoTable(doc, {
					...basePdfTableOptions,
					startY: currentY,
					tableWidth: availWidth,
					head: [
						[
							'#',
							'ID',
							'Service Name',
							'Reg. No.',
							'Status',
							'Mode',
							'Starting Date',
							'Ending Date',
							'Duties',
							'Collection'
						]
					],
					body: serviceBody,
					foot: [
						[
							{ content: 'Total', colSpan: 8, styles: { halign: 'right' } },
							totalDuties,
							formatPdfCurrency(grandTotal)
						]
					],
					columnStyles: {
						0: { cellWidth: scaled[0], halign: 'center' },
						1: { cellWidth: scaled[1], halign: 'center' },
						2: { cellWidth: scaled[2] },
						3: { cellWidth: scaled[3] },
						4: { cellWidth: scaled[4] },
						5: { cellWidth: scaled[5] },
						6: { cellWidth: scaled[6] },
						7: { cellWidth: scaled[7] },
						8: { cellWidth: scaled[8], halign: 'center' },
						9: { cellWidth: scaled[9], halign: 'center' }
					},
					didParseCell: ({ cell, column, section }) => {
						if (
							column.index === 0 ||
							column.index === 1 ||
							column.index === 8 ||
							column.index === 9
						) {
							cell.styles.halign = 'center';
						}

						if (section === 'foot' && (column.index === 8 || column.index === 9)) {
							cell.styles.halign = 'center';
						}
					}
				});
			}

			if (operatorRows.length > 0) {
				currentY = getLastTableY(doc, currentY) + 26;
				currentY = addPdfSectionTitle(doc, 'Operator-wise Collection', currentY);

				const availWidth = doc.internal.pageSize.getWidth() - PDF_MARGIN.left - PDF_MARGIN.right;
				const opCol0 = 30;
				const opCol2 = 110;
				const opCol3 = 80;
				const opCol4 = 150;
				const opCol1 = Math.max(80, availWidth - (opCol0 + opCol2 + opCol3 + opCol4));

				autoTable(doc, {
					...basePdfTableOptions,
					startY: currentY,
					tableWidth: availWidth,
					head: [['#', 'Operator', 'Operator ID', 'Duties', 'Collection']],
					body: operatorRows.map((op, i) => [
						i + 1,
						op.name,
						`#${op.operator_id}`,
						op.duty_count,
						formatPdfCurrency(op.total_collection)
					]),
					foot: [
						[
							{ content: 'Total', colSpan: 3, styles: { halign: 'right' } },
							operatorRows.reduce((s, r) => s + r.duty_count, 0),
							formatPdfCurrency(operatorRows.reduce((s, r) => s + r.total_collection, 0))
						]
					],
					columnStyles: {
						0: { cellWidth: opCol0, halign: 'center' },
						1: { cellWidth: opCol1 },
						2: { cellWidth: opCol2, halign: 'center' },
						3: { cellWidth: opCol3, halign: 'center' },
						4: { cellWidth: opCol4, halign: 'center' }
					},
					didParseCell: ({ cell, column, section }) => {
						if (
							column.index === 0 ||
							column.index === 2 ||
							column.index === 3 ||
							column.index === 4
						) {
							cell.styles.halign = 'center';
						}

						if (section === 'foot' && (column.index === 3 || column.index === 4)) {
							cell.styles.halign = 'center';
						}
					}
				});
			}

			if (vehicleRows.length > 0) {
				currentY = getLastTableY(doc, currentY) + 26;
				currentY = addPdfSectionTitle(doc, 'Vehicle-wise Collection', currentY);

				const availWidth = doc.internal.pageSize.getWidth() - PDF_MARGIN.left - PDF_MARGIN.right;
				const vcol0 = 30;
				const vcol2 = 110;
				const vcol3 = 80;
				const vcol4 = 150;
				const vcol1 = Math.max(80, availWidth - (vcol0 + vcol2 + vcol3 + vcol4));

				autoTable(doc, {
					...basePdfTableOptions,
					startY: currentY,
					tableWidth: availWidth,
					head: [['#', 'Vehicle', 'Vehicle ID', 'Duties', 'Collection']],
					body: vehicleRows.map((v, i) => {
						const reg = v.registration_number;
						const showReg = reg && String(reg).trim().toUpperCase() !== 'N/A';
						return [
							i + 1,
							`${v.vehicle_name}${showReg ? ` (${reg})` : ''}`,
							v.vehicle_id != null ? `#${v.vehicle_id}` : '',
							v.duty_count,
							formatPdfCurrency(v.total_collection)
						];
					}),
					foot: [
						[
							{ content: 'Total', colSpan: 3, styles: { halign: 'right' } },
							vehicleRows.reduce((s, r) => s + r.duty_count, 0),
							formatPdfCurrency(vehicleRows.reduce((s, r) => s + r.total_collection, 0))
						]
					],
					columnStyles: {
						0: { cellWidth: vcol0, halign: 'center' },
						1: { cellWidth: vcol1 },
						2: { cellWidth: vcol2, halign: 'center' },
						3: { cellWidth: vcol3, halign: 'center' },
						4: { cellWidth: vcol4, halign: 'center' }
					},
					didParseCell: ({ cell, column, section }) => {
						if (
							column.index === 0 ||
							column.index === 2 ||
							column.index === 3 ||
							column.index === 4
						) {
							cell.styles.halign = 'center';
						}

						if (section === 'foot' && (column.index === 3 || column.index === 4)) {
							cell.styles.halign = 'center';
						}
					}
				});
			}

			addPdfFooters(doc);
			doc.save(pdfFileName());
		} catch (err) {
			console.error(err);
			toast.error('Failed to generate PDF. Please try again.');
		} finally {
			downloadingPdf = false;
		}
	}

	//-- Paginated fetchers (API max is 100) --
	async function fetchAllServices(ids: number[]) {
		const PAGE = 100;
		let offset = 0;
		let all: any[] = [];
		while (true) {
			const page = await fetchServiceList({ id_list: ids, limit: PAGE, offset });
			const results = Array.isArray(page) ? page : [];
			all = [...all, ...results];
			if (results.length < PAGE) break;
			offset += PAGE;
		}
		return all;
	}

	async function fetchAllDuties(service_id: number) {
		const PAGE = 100;
		let offset = 0;
		let all: any[] = [];
		while (true) {
			const page = await fetchDutyList({ service_id, limit: PAGE, offset });
			const results = Array.isArray(page) ? page : [];
			all = [...all, ...results];
			if (results.length < PAGE) break;
			offset += PAGE;
		}
		return all;
	}

	//-- Load data --
	async function loadReport() {
		// guard and request-id to ignore stale responses
		const req = ++reportRequestId;

		if (serviceIds.length === 0) {
			// if this request is still current, show error
			if (req === reportRequestId) {
				toast.error('No service IDs provided.');
				loading = false;
			}
			return;
		}

		try {
			//-- Fetch services by id_list --
			const services = await fetchAllServices(serviceIds);
			if (req !== reportRequestId) return; // stale

			//-- Fetch duties for each service in parallel --
			const dutiesPerService = await Promise.all(serviceIds.map((sid) => fetchAllDuties(sid)));
			if (req !== reportRequestId) return; // stale

			//-- Optionally fetch missing service details to get vehicle name --
			const servicesById = new Map<number, any>();
			if (Array.isArray(services)) for (const s of services) servicesById.set(s.id, s);

			//-- Fetch service details for all selected services to get reliable vehicle data --
			const detailMap = new Map<number, any>();
			{
				// fetch details in limited-size batches to avoid bursting many concurrent requests
				const BATCH = 8;
				try {
					for (let i = 0; i < serviceIds.length; i += BATCH) {
						const chunk = serviceIds.slice(i, i + BATCH);
						const settled = await Promise.allSettled(chunk.map((id) => fetchServiceDetail(id)));
						if (req !== reportRequestId) break; // stop if a newer request started

						settled.forEach((res, idx) => {
							const id = chunk[idx];
							if (res.status === 'fulfilled') {
								const d = res.value;
								if (d && d.id != null) detailMap.set(d.id, d);
							} else {
								// log the failure so missing data is diagnosable
								console.warn(`fetchServiceDetail failed for id ${id}:`, res.reason ?? 'no reason');
							}
						});
					}
				} catch (err) {
					console.error('Error fetching service details:', err);
				}
			}

			//-- Build report rows --
			const builtRows = serviceIds
				.map((sid, idx) => {
					const svc = servicesById.get(sid) ?? null;
					if (!svc) return null;

					const duties = dutiesPerService[idx] ?? [];
					const total = duties.reduce((sum, d) => {
						const val = parseFloat(d.collection ?? '0');
						return sum + (isNaN(val) ? 0 : val);
					}, 0);

					const detail = detailMap.get(svc.id);
					const vehicleName = (svc as any).vehicle?.name ?? detail?.vehicle?.name ?? 'N/A';
					const vehicleId =
						svc.vehicle_id ??
						(svc as any).vehicle?.vehicle_id ??
						detail?.vehicle?.vehicle_id ??
						null;
					const vehicleRegistrationNumber =
						(svc as any).vehicle?.registration_number ??
						detail?.vehicle?.registration_number ??
						svc.registration_number ??
						'N/A';

					return {
						id: svc.id,
						name: svc.name ?? 'N/A',
						registration_number: vehicleRegistrationNumber,
						status: svc.status,
						ticket_mode: svc.ticket_mode,
						vehicle_id: vehicleId,
						vehicle_name: vehicleName,
						starting_at: svc.starting_at,
						ending_at: svc.ending_at,
						total_collection: total,
						duty_count: duties.length
					} satisfies ReportRow;
				})
				.filter((r): r is ReportRow => r !== null);

			if (req !== reportRequestId) return; // stale before updating state
			rows = builtRows;

			//-- Build operator-wise breakdown from all duties --
			const allDuties = dutiesPerService.flat();
			const opMap = new Map<number, { duty_count: number; total_collection: number }>();
			for (const d of allDuties) {
				if (d.operator_id == null) continue;
				const val = parseFloat(d.collection ?? '0');
				const existing = opMap.get(d.operator_id);
				if (existing) {
					existing.duty_count += 1;
					existing.total_collection += isNaN(val) ? 0 : val;
				} else {
					opMap.set(d.operator_id, { duty_count: 1, total_collection: isNaN(val) ? 0 : val });
				}
			}

			//-- Fetch operator names for all unique operator IDs --
			const opIds = [...opMap.keys()];
			let opNameMap = new Map<number, string>();
			if (opIds.length > 0) {
				try {
					const operators = await fetchOperatorAccount({ id_list: opIds, limit: 100 });
					if (req !== reportRequestId) return; // stale after fetch
					if (Array.isArray(operators)) {
						for (const op of operators) {
							opNameMap.set(op.id, op.full_name ?? op.username ?? `Operator #${op.id}`);
						}
					}
				} catch {
					// Names unavailable; fall back to ID display
				}
			}

			operatorRows = opIds
				.map((oid) => ({
					operator_id: oid,
					name: opNameMap.get(oid) ?? `Operator #${oid}`,
					...opMap.get(oid)!
				}))
				.sort((a, b) => b.total_collection - a.total_collection);

			//-- Build vehicle-wise breakdown from services (rows)
			const vMap = new Map<
				string,
				{
					vehicle_id: number | null;
					vehicle_name: string;
					registration_number: string;
					duty_count: number;
					total_collection: number;
				}
			>();
			for (const r of builtRows) {
				//-- Determine a key for grouping vehicles, prioritizing reliable IDs but falling back to registration/name --
				const vehicleRegistrationNumber = r.registration_number ?? '';
				//-- Consider values like null, undefined, empty string, or 'N/A' (case-insensitive) as placeholders --
				const isPlaceholder = (s: string | null | undefined) =>
					!s || String(s).trim().toUpperCase() === 'N/A';

				let key: string;
				if (r.vehicle_id != null) {
					key = `id:${r.vehicle_id}`;
				} else if (!isPlaceholder(vehicleRegistrationNumber) || !isPlaceholder(r.vehicle_name)) {
					key = `fallback:${vehicleRegistrationNumber}|${r.vehicle_name}`;
				} else {
					key = `service:${r.id}`;
				}

				const existing = vMap.get(key);
				if (existing) {
					existing.duty_count += r.duty_count;
					existing.total_collection += r.total_collection;
					if (!existing.registration_number && vehicleRegistrationNumber) {
						existing.registration_number = vehicleRegistrationNumber;
					}
					if (!existing.vehicle_name && r.vehicle_name) {
						existing.vehicle_name = r.vehicle_name;
					}
					if (existing.vehicle_id == null && r.vehicle_id != null) {
						existing.vehicle_id = r.vehicle_id;
					}
				} else {
					vMap.set(key, {
						vehicle_id: r.vehicle_id,
						vehicle_name: r.vehicle_name,
						registration_number: vehicleRegistrationNumber,
						duty_count: r.duty_count,
						total_collection: r.total_collection
					});
				}
			}

			vehicleRows = [...vMap.values()]
				.map((v) => ({
					vehicle_id: v.vehicle_id,
					vehicle_name: v.vehicle_name,
					registration_number: v.registration_number,
					duty_count: v.duty_count,
					total_collection: v.total_collection
				}))
				.sort((a, b) => b.total_collection - a.total_collection);

			generatedAt = new Intl.DateTimeFormat('en-IN', {
				timeZone: 'Asia/Kolkata',
				year: 'numeric',
				month: 'short',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
			}).format(new Date());
		} catch (err: any) {
			if (req !== reportRequestId) return; // ignore errors from stale requests
			const msg = await handleApiError(err);
			toast.error(msg || 'Failed to load report data.');
		} finally {
			if (req === reportRequestId) loading = false;
		}
	}

	// loadReport is triggered reactively when `serviceIds` changes.

	function handleBack() {
		goto(backToReportUrl);
	}

	function handlePrint() {
		handleDownloadPdf();
	}
</script>

<div class="main-div d-flex flex-column min-vh-100">
	<div class="sticky-top no-print">
		<HeaderBar />
	</div>

	<main class="container-xl py-4 page-wrapper">
		<!-- Toolbar (hidden on print) -->
		<div class="toolbar no-print">
			<button class="back-btn" type="button" on:click={handleBack}>
				<i class="bi bi-arrow-left"></i>
				Back
			</button>
			{#if !loading && rows.length > 0}
				<button class="print-btn" type="button" on:click={handlePrint} disabled={downloadingPdf}>
					{#if downloadingPdf}
						<span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
						Preparing PDF
					{:else}
						<i class="bi bi-download"></i>
						Download PDF
					{/if}
				</button>
			{/if}
		</div>

		{#if loading}
			<div class="state-box">
				<div class="spinner-border text-primary" role="status" style="width:2.5rem;height:2.5rem;">
					<span class="visually-hidden">Loading...</span>
				</div>
				<p>Generating report...</p>
			</div>
		{:else if rows.length === 0}
			<div class="state-box">
				<i class="bi bi-inbox empty-icon"></i>
				<p class="empty-title">No data available for the selected criteria</p>
				<p class="empty-sub">The selected services could not be found or have no data.</p>
			</div>
		{:else}
			<!-- Report document -->
			<div class="report-doc" id="report-content">
				<!-- Report header -->
				<div class="report-header">
					<div class="report-title-block">
						<h1 class="report-title">Service Collection Report</h1>
						<p class="report-subtitle">{companyName}</p>
					</div>
					<div class="report-meta">
						<div class="meta-row">
							<span class="meta-label">Period</span>
							<span class="meta-value"
								>{formatDisplayDate(fromDate)} - {formatDisplayDate(toDate)}</span
							>
						</div>
						<div class="meta-row">
							<span class="meta-label">Services</span>
							<span class="meta-value">{rows.length}</span>
						</div>
						<div class="meta-row">
							<span class="meta-label">Generated</span>
							<span class="meta-value">{generatedAt}</span>
						</div>
					</div>
				</div>

				<div class="report-divider"></div>

				<!-- Service-wise breakdown (full width) -->
				<div class="table-section">
					<h2 class="section-title">Service-wise Breakdown</h2>
					<div class="report-table-wrap">
						<table class="report-table report-table--services">
							<colgroup>
								<col class="col-index" />
								<col class="col-id" />
								<col class="col-service" />
								<col class="col-reg" />
								<col class="col-status" />
								<col class="col-mode" />
								<col class="col-date" />
								<col class="col-date" />
								<col class="col-duties" />
								<col class="col-amount" />
							</colgroup>
							<thead>
								<tr>
									<th>#</th>
									<th>ID</th>
									<th>Service Name</th>
									<th>Reg. No.</th>
									<th>Status</th>
									<th>Mode</th>
									<th>Starting Date</th>
									<th>Ending Date</th>
									<th class="col-duties">Duties</th>
									<th class="col-amount">Collection (INR)</th>
								</tr>
							</thead>
							<tbody>
								{#each rows as row, i (row.id)}
									<tr>
										<td class="cell-num">{i + 1}</td>
										<td class="cell-id">#{row.id}</td>
										<td class="cell-name">{row.name}</td>
										<td class="cell-reg">{row.registration_number}</td>
										<td>
											<span
												class="status-chip"
												style="background:{statusColor(row.status)}1a; color:{statusColor(
													row.status
												)}; border:1px solid {statusColor(row.status)}44;"
											>
												{statusLabel(row.status)}
											</span>
										</td>
										<td class="cell-mode">{ticketModeLabel(row.ticket_mode)}</td>
										<td class="cell-date">{formatDateTime(row.starting_at)}</td>
										<td class="cell-date">{formatDateTime(row.ending_at)}</td>
										<td class="cell-duties">{row.duty_count}</td>
										<td class="cell-amount">
											{row.total_collection > 0
												? formatCurrency(row.total_collection)
												: row.duty_count === 0
													? 'N/A'
													: formatCurrency(0)}
										</td>
									</tr>
								{/each}
							</tbody>
							<tfoot>
								<tr class="total-row">
									<td colspan="8" class="total-label">Total</td>
									<td class="cell-duties">{totalDuties}</td>
									<td class="cell-amount total-amount">{formatCurrency(grandTotal)}</td>
								</tr>
							</tfoot>
						</table>
					</div>
				</div>

				{#if operatorRows.length > 0 || vehicleRows.length > 0}
					<!-- Bottom row: operator table + summary info panel side by side -->
					<div class="tables-row">
						{#if operatorRows.length > 0}
							<!-- Operator-wise breakdown -->
							<div class="table-section table-section--operator">
								<h2 class="section-title">Operator-wise Collection</h2>
								<div class="report-table-wrap">
									<table class="report-table report-table--operators">
										<colgroup>
											<col class="col-index" />
											<col class="col-operator" />
											<col class="col-duties" />
											<col class="col-amount" />
										</colgroup>
										<thead>
											<tr>
												<th>#</th>
												<th>Operator</th>
												<th class="col-duties">Duties</th>
												<th class="col-amount">Collection (INR)</th>
											</tr>
										</thead>
										<tbody>
											{#each operatorRows as op, i (op.operator_id)}
												<tr>
													<td class="cell-num">{i + 1}</td>
													<td>
														<p class="op-name">{op.name}</p>
														<p class="op-id">ID #{op.operator_id}</p>
													</td>
													<td class="cell-duties">{op.duty_count}</td>
													<td class="cell-amount">{formatCurrency(op.total_collection)}</td>
												</tr>
											{/each}
										</tbody>
										<tfoot>
											<tr class="total-row">
												<td colspan="2" class="total-label">Total</td>
												<td class="cell-duties"
													>{operatorRows.reduce((s, r) => s + r.duty_count, 0)}</td
												>
												<td class="cell-amount total-amount"
													>{formatCurrency(
														operatorRows.reduce((s, r) => s + r.total_collection, 0)
													)}</td
												>
											</tr>
										</tfoot>
									</table>
								</div>
							</div>
						{/if}

						{#if vehicleRows.length > 0}
							<!-- Vehicle-wise breakdown (fills remaining space) -->
							<div class="table-section table-section--vehicle" style="min-width: 0;">
								<h2 class="section-title">Vehicle-wise Collection</h2>
								<div class="report-table-wrap">
									<table class="report-table report-table--vehicles">
										<colgroup>
											<col class="col-index" />
											<col class="col-operator" />
											<col class="col-duties" />
											<col class="col-amount" />
										</colgroup>
										<thead>
											<tr>
												<th>#</th>
												<th>Vehicle</th>
												<th class="col-duties">Duties</th>
												<th class="col-amount">Collection (INR)</th>
											</tr>
										</thead>
										<tbody>
											{#each vehicleRows as v, i ((v.vehicle_id ?? 'null') + '|' + (v.vehicle_name ?? '') + '|' + (v.registration_number ?? ''))}
												<tr>
													<td class="cell-num">{i + 1}</td>
													<td>
														<p class="op-name">
															{v.vehicle_name && v.vehicle_name.trim()
																? v.vehicle_name
																: 'N/A'}{v.registration_number &&
															String(v.registration_number).trim() &&
															String(v.registration_number).trim().toUpperCase() !== 'N/A'
																? ` (${v.registration_number.trim()})`
																: ''}
														</p>
														<p class="op-id">
															{v.vehicle_id !== null ? `ID #${v.vehicle_id}` : ''}
														</p>
													</td>
													<td class="cell-duties">{v.duty_count}</td>
													<td class="cell-amount">{formatCurrency(v.total_collection)}</td>
												</tr>
											{/each}
										</tbody>
										<tfoot>
											<tr class="total-row">
												<td colspan="2" class="total-label">Total</td>
												<td class="cell-duties"
													>{vehicleRows.reduce((s, r) => s + r.duty_count, 0)}</td
												>
												<td class="cell-amount total-amount"
													>{formatCurrency(
														vehicleRows.reduce((s, r) => s + r.total_collection, 0)
													)}</td
												>
											</tr>
										</tfoot>
									</table>
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Top totals (show with header) -->
				<div class="top-totals">
					<div class="summary-card highlight">
						<p class="sum-label">Grand Collection</p>
						<p class="sum-value">{formatCurrency(grandTotal)}</p>
					</div>
					<div class="summary-card">
						<p class="sum-label">Total Duties</p>
						<p class="sum-value">{totalDuties}</p>
					</div>
					<div class="summary-card">
						<p class="sum-label">Total Services</p>
						<p class="sum-value">{totalServices}</p>
					</div>
				</div>
				<!-- Report footer -->
				<div class="report-footer">
					<p>This is a system-generated report. No signature required.</p>
					<p>Generated on {generatedAt} (IST)</p>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	.main-div {
		background: var(--bg-primary);
		min-height: 100vh;
	}

	/* Toolbar */
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 36px;
		padding: 0 14px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-card);
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}
	.back-btn:hover {
		background: var(--bg-primary);
	}

	.print-btn {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		height: 36px;
		padding: 0 16px;
		border-radius: 8px;
		border: none;
		background: var(--edit-btn);
		color: #fff;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.print-btn:hover {
		opacity: 0.9;
	}
	.print-btn:disabled {
		cursor: wait;
		opacity: 0.75;
	}

	/* State boxes */
	.state-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		min-height: 40vh;
		color: var(--text-muted);
		font-size: 14px;
	}
	.empty-icon {
		font-size: 40px;
	}
	.empty-title {
		font-size: 15px;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0;
	}
	.empty-sub {
		font-size: 13px;
		color: var(--text-muted);
		margin: 0;
	}

	/* Report document */
	.report-doc {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 2rem 2.5rem;
		max-width: 100%;
	}

	/* Report header */
	.report-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.25rem;
	}
	.report-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}
	.report-subtitle {
		font-size: 13px;
		color: var(--text-muted);
		margin: 4px 0 0;
	}
	.report-meta {
		display: flex;
		flex-direction: column;
		gap: 5px;
		text-align: right;
	}
	.meta-row {
		display: flex;
		align-items: center;
		gap: 8px;
		justify-content: flex-end;
	}
	.meta-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.meta-value {
		font-size: 13px;
		color: var(--text-primary);
		font-weight: 500;
	}

	.report-divider {
		height: 1px;
		background: var(--border);
		margin-bottom: 1.5rem;
	}

	.summary-card {
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 1rem 1.25rem;
	}
	.summary-card.highlight {
		background: color-mix(in srgb, var(--edit-btn) 8%, transparent);
		border-color: color-mix(in srgb, var(--edit-btn) 30%, transparent);
	}
	.sum-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 6px;
	}
	.sum-value {
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}
	.summary-card.highlight .sum-value {
		color: var(--edit-btn);
	}

	/* Tables row layout (operator table + summary side panel) */
	.tables-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
		align-items: flex-start;
		gap: 20px;
		margin-top: 1.75rem;
		margin-bottom: 2rem;
	}
	.table-section {
		margin-bottom: 1.75rem;
	}
	.table-section--operator {
		flex: 1 1 0;
		min-width: 0;
	}
	.section-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 12px;
	}
	.op-name {
		margin: 0;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-primary);
	}
	.op-id {
		margin: 2px 0 0;
		font-size: 11px;
		color: var(--text-muted);
	}
	.report-table-wrap {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		border: 1px solid var(--border);
		border-radius: 8px;
	}
	.report-table {
		width: 100%;
		min-width: 0; /* allow container to control width */
		border-collapse: collapse;
		table-layout: fixed;
		font-size: 13px;
	}
	.report-table--services {
		min-width: 0; /* responsive: don't force extra width */
	}
	.report-table--operators {
		min-width: 0;
	}
	.report-table--vehicles {
		min-width: 0;
	}

	/* Top totals */
	.top-totals {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 12px;
		margin-bottom: 12px;
	}
	.top-totals .summary-card {
		flex: 1 1 220px;
	}
	.report-table col.col-index {
		width: 48px;
	}
	.report-table col.col-id {
		width: 70px;
	}
	.report-table col.col-service {
		width: 190px;
	}
	.report-table col.col-reg {
		width: 100px;
	}
	.report-table col.col-status {
		width: 105px;
	}
	.report-table col.col-mode {
		width: 105px;
	}
	.report-table col.col-date {
		width: 140px;
	}
	.report-table col.col-duties {
		width: 72px;
	}
	.report-table col.col-amount {
		width: 140px;
	}
	.report-table col.col-operator {
		width: 250px;
	}
	.report-table thead tr {
		background: var(--bg-primary);
		border-bottom: 1px solid var(--border);
	}
	.report-table th {
		padding: 10px 12px;
		text-align: left;
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
		line-height: 1.25;
	}
	.report-table td {
		padding: 11px 12px;
		border-bottom: 1px solid var(--border);
		color: var(--text-primary);
		vertical-align: middle;
		overflow-wrap: break-word;
		word-break: normal;
	}
	.report-table tbody tr:last-child td {
		border-bottom: none;
	}
	.report-table tbody tr:hover {
		background: var(--bg-primary);
	}
	.report-table tfoot .total-row td {
		background: var(--bg-primary);
		font-weight: 700;
		font-size: 13px;
		border-top: 2px solid var(--border);
		color: var(--text-primary);
	}
	.total-label {
		text-align: right;
		padding-right: 16px !important;
		font-size: 12px !important;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.total-amount {
		color: var(--edit-btn) !important;
		font-size: 14px !important;
	}

	.cell-num,
	.cell-id {
		font-size: 12px;
		color: var(--text-muted);
	}
	.cell-name {
		font-weight: 500;
	}
	.cell-reg {
		font-family: monospace;
		font-size: 12px;
		word-break: break-word;
	}
	.cell-mode {
		font-size: 12px;
		color: var(--text-muted);
	}
	.cell-date {
		font-size: 12px;
		line-height: 1.35;
	}
	.cell-duties {
		text-align: center;
	}
	.col-duties,
	.col-amount {
		text-align: center;
	}
	.cell-amount {
		text-align: center;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.status-chip {
		display: inline-block;
		padding: 3px 10px;
		border-radius: 20px;
		font-size: 11px;
		font-weight: 600;
		white-space: nowrap;
	}

	/* Report footer */
	.report-footer {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
		text-align: center;
		font-size: 11px;
		color: var(--text-muted);
		line-height: 1.6;
	}
	.report-footer p {
		margin: 0;
	}

	/* Print styles */
	@media print {
		.no-print {
			display: none !important;
		}

		.main-div {
			background: #fff;
		}

		.report-doc {
			border: none;
			border-radius: 0;
			padding: 0;
			box-shadow: none;
		}
		.page-wrapper {
			width: 100% !important;
			max-width: none !important;
			padding: 0 !important;
		}

		.tables-row {
			display: block;
		}

		.summary-card,
		.report-table-wrap {
			border-color: #ccc;
		}
		.report-table-wrap {
			overflow: visible;
			border-radius: 0;
		}
		.report-table {
			width: 100% !important;
			min-width: 0 !important;
			font-size: 8px;
			page-break-inside: auto;
		}
		.report-table th,
		.report-table td {
			padding: 4px 5px;
		}
		.report-table tr {
			page-break-inside: avoid;
			page-break-after: auto;
		}
		.report-table thead {
			display: table-header-group;
		}
		.report-table tfoot {
			display: table-footer-group;
		}

		.report-table thead tr,
		.report-table tfoot .total-row td {
			background: #f5f5f5 !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		.status-chip {
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		.summary-card.highlight {
			background: #f0f4ff !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		@page {
			size: A4 landscape;
			margin: 1cm;
		}
	}

	@media (max-width: 768px) {
		.report-doc {
			padding: 1.25rem;
		}
		.report-header {
			flex-direction: column;
		}
		.report-meta {
			text-align: left;
		}
		.meta-row {
			justify-content: flex-start;
		}

		.tables-row {
			grid-template-columns: 1fr;
		}
	}
</style>
