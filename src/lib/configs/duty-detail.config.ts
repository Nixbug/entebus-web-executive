import type { DetailConfig } from '$lib/types/detail-config';
import type { Duty } from '$lib/types/type';
import { DUTY_STATUS_TRANSITIONS } from '$lib/constants';

export function getDutyDetailConfig(data: Duty): DetailConfig {
	const validNextStatuses = DUTY_STATUS_TRANSITIONS[data.statusLabel] ?? [];
	const canTransition = validNextStatuses.length > 0;

	return {
		title: 'Duty Details',
		avatar: {
			icon: 'bi bi-bus-front',
			color: '#3b82f6',
			name: data.id,
			designation: data.statusLabel
		},
		sections: [
			{
				title: 'DUTY DETAILS',
				fields: [
					{
						key: 'id',
						label: 'DUTY ID',
						value: data.id,
						type: 'text',
						editable: false,
						icon: 'bi bi-hash',
						iconColor: '#a56bfd',
						iconBg: 'rgba(113, 33, 247, 0.18)'
					},
					{
						key: 'statusLabel',
						label: 'STATUS',
						value: data.statusLabel,
						type: 'select',
						editable: canTransition,
						options: canTransition ? [data.statusLabel, ...validNextStatuses] : [data.statusLabel],
						icon: 'bi bi-toggle-on',
						iconColor: '#db2777',
						iconBg: 'rgba(219, 39, 119, 0.18)'
					},
					{
						key: 'operatorName',
						label: 'OPERATOR',
						value: data.operatorName,
						type: 'text',
						editable: false,
						icon: 'bi bi-person-badge',
						iconColor: '#f97316',
						iconBg: 'rgba(249, 115, 22, 0.15)'
					},
					{
						key: 'serviceName',
						label: 'SERVICE',
						value: data.serviceName,
						type: 'text',
						editable: false,
						icon: 'bi bi-signpost-split',
						iconColor: '#10b981',
						iconBg: 'rgba(16, 185, 129, 0.15)'
					}
				]
			},
			{
				title: 'TIMELINE',
				fields: [
					{
						key: 'startedOn',
						label: 'STARTED ON',
						value: data.startedOn,
						type: 'date',
						editable: false,
						icon: 'bi bi-play-circle',
						iconColor: '#22c55e',
						iconBg: 'rgba(34, 197, 94, 0.15)'
					},
					{
						key: 'finishedOn',
						label: 'FINISHED ON',
						value: data.finishedOn,
						type: 'date',
						editable: false,
						icon: 'bi bi-stop-circle',
						iconColor: '#ef4444',
						iconBg: 'rgba(239, 68, 68, 0.15)'
					},
					{
						key: 'createdAt',
						label: 'CREATED AT',
						value: data.createdAt,
						type: 'date',
						editable: false,
						icon: 'bi bi-calendar3',
						iconColor: '#3b82f6',
						iconBg: 'rgba(59, 130, 246, 0.18)'
					},
					{
						key: 'updatedAt',
						label: 'UPDATED AT',
						value: data.updatedAt,
						type: 'date',
						editable: false,
						icon: 'bi bi-calendar3',
						iconColor: '#3b82f6',
						iconBg: 'rgba(59, 130, 246, 0.18)'
					}
				]
			}
		],
		actions: {
			edit: true,
			delete: false
		}
	};
}
