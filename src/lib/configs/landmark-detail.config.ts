import type { DetailConfig } from '$lib/types/detail-config';
import { landmarkSchema } from '$lib/schemas';
export function getLandmarkDetailConfig(data: any): DetailConfig {
	return {
		title: 'Landmark Details',
		sections: [
			{
				title: 'LANDMARK INFORMATION',
				fields: [
					{
						key: 'type',
						label: 'TYPE',
						value: data.type,
						type: 'select',
						editable: true,
						icon: 'bi bi-tags',
						iconColor: '#db2777',
						iconBg: 'rgba(219, 39, 119, 0.18)',
						options: ['Local', 'Village', 'District', 'State', 'National']
					},
					{
						key: 'name',
						label: 'NAME',
						value: data.name,
						type: 'text',
						editable: true,
						icon: 'bi bi-geo-alt-fill',
						iconColor: '#2296f3',
						iconBg: 'rgba(34, 150, 243, 0.15)',
						autoFocus: true
					},
					{
						key: 'boundary',
						label: 'BOUNDARY',
						value: data.boundary,
						type: 'custom',
						editable: true,
						icon: 'bi bi-map-fill',
						iconColor: '#f59e0b',
						iconBg: 'rgba(245, 158, 11, 0.15)'
					}
				]
			}
		],
		//-- Schema for this specific entity --
		validationSchema: landmarkSchema,
		//-- Mapping from detail page fields to schema fields --
		validationMapping: {
			name: 'name',
			type: 'type',
			boundary: 'boundary'
		},
		//-- Prepare data for validation --
		prepareForValidation: (editableData) => ({
			name: editableData.name || '',
			type: editableData.type || '',
			boundary: editableData.boundary || ''
		}),
		actions: {
			edit: true,
			delete: true
		}
	};
}
