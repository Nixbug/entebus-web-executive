import type { DetailConfig } from '$lib/types/detail-config';
import type { Vehicle } from '$lib/types/type';
import { companyVehicleUpdateSchema } from '$lib/schemas';
import {
	fetchVehicleImageForVehicle,
	fetchVehicleImage,
	deleteVehicleImage,
	uploadVehicleImage,
	clearVehicleImageCache
} from '$lib/services/vehicle-image';
export function getVehicleDetailConfig(data: Vehicle): DetailConfig {
	return {
		title: 'Vehicle Details',
		avatar: {
			icon: 'bi bi-bus-front-fill',
			color: '#3b82f6',
			name: data.name,
			registrationNumber: data.registrationNumber,
			loadImage: async (vehicleId: number) => {
				try {
					return await fetchVehicleImageForVehicle(vehicleId, { width: 300, height: 300 });
				} catch (e) {
					console.warn('loadImage failed', e);
					return null;
				}
			},
			uploadImage: async (vehicleId: number, file: File) => {
				// Validate vehicleId upfront
				if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
					throw new Error(
						`Invalid vehicle ID: ${vehicleId}. Vehicle ID must be a positive integer.`
					);
				}

				// Clear cache before upload to avoid stale data
				clearVehicleImageCache(vehicleId);

				try {
					const list = await fetchVehicleImage({ vehicle_id: vehicleId });
					const items = Array.isArray(list)
						? list
						: list && (list as any).data
							? (list as any).data
							: [];
					if (items && items.length) {
						const matchedItems = items.filter((it: any) => Number(it?.vehicle_id) === vehicleId);
						const itemsMissingVehicleId = items.filter(
							(it: any) => it?.vehicle_id == null || it?.vehicle_id === ''
						);
						const itemsToDelete =
							matchedItems.length > 0
								? matchedItems
								: items.length === 1 && itemsMissingVehicleId.length === 1
									? items
									: [];
						for (const item of itemsToDelete) {
							const existingId = Number(item.id);
							if (existingId && !Number.isNaN(existingId)) {
								try {
									await deleteVehicleImage(existingId);
								} catch (e) {
									console.warn('Failed to delete existing vehicle image', e);
								}
							}
						}
					}
				} catch (e) {
					console.warn('Failed to check existing images before upload', e);
				}

				const companyId = data.companyId
					? Number(data.companyId)
					: Number((data as any).company_id ?? 0);

				// Validate companyId is a valid positive integer
				if (!Number.isInteger(companyId) || companyId <= 0) {
					throw new Error(
						`Invalid company ID: ${companyId}. Company ID must be a positive integer.`
					);
				}

				// Clear cache again after upload to ensure fresh fetch
				clearVehicleImageCache(vehicleId);
				return await uploadVehicleImage(file, vehicleId, companyId);
			},
			deleteImage: async (imageId: number) => {
				return await deleteVehicleImage(imageId);
			},
			clearImageCache: (vehicleId?: number) => {
				try {
					clearVehicleImageCache(vehicleId);
				} catch (e) {
					console.warn('clearImageCache failed', e);
				}
			}
		},
		sections: [
			{
				title: 'VEHICLE INFORMATION',
				fields: [
					{
						key: 'registrationNumber',
						label: 'REGISTRATION NUMBER',
						value: data.registrationNumber,
						type: 'text',
						icon: 'bi bi-hash',
						iconColor: '#f59e42',
						iconBg: 'rgba(245, 158, 66, 0.15)',
						editable: false
					},
					{
						key: 'name',
						label: 'NAME',
						value: data.name,
						type: 'text',
						editable: true,
						icon: 'bi bi-truck',
						iconColor: '#16a34a',
						iconBg: 'rgba(22, 163, 74, 0.15)',
						autoFocus: true
					},
					{
						key: 'capacity',
						label: 'CAPACITY',
						value: data.capacity,
						type: 'number',
						editable: true,
						icon: 'bi bi-person-arms-up',
						iconColor: '#f97316',
						iconBg: 'rgba(249, 115, 22, 0.15)'
					},
					{
						key: 'status',
						label: 'STATUS',
						value: data.status,
						type: 'select',
						editable: true,
						icon: 'bi bi-toggle-on',
						iconColor: '#db2777',
						iconBg: 'rgba(219, 39, 119, 0.18)',
						options: ['Created', 'Active', 'Maintenance', 'Suspended']
					},
					{
						key: 'manufactured_on',
						label: 'MANUFACTURED ON',
						value: data.manufactured_on,
						type: 'date',
						editable: true,
						icon: 'bi bi-calendar-check',
						iconColor: '#6366f1',
						iconBg: 'rgba(99, 102, 241, 0.15)'
					},
					{
						key: 'insurance_upto',
						label: 'INSURANCE UPTO',
						value: data.insurance_upto || null,
						type: 'date',
						editable: true,
						icon: 'bi bi-calendar-check',
						iconColor: '#6366f1',
						iconBg: 'rgba(99, 102, 241, 0.15)'
					},
					{
						key: 'fitness_upto',
						label: 'FITNESS UPTO',
						value: data.fitness_upto || null,
						type: 'date',
						editable: true,
						icon: 'bi bi-calendar-check',
						iconColor: '#6366f1',
						iconBg: 'rgba(99, 102, 241, 0.15)'
					},
					{
						key: 'pollution_upto',
						label: 'POLLUTION UPTO',
						value: data.pollution_upto || null,
						type: 'date',
						editable: true,
						icon: 'bi bi-calendar-check',
						iconColor: '#6366f1',
						iconBg: 'rgba(99, 102, 241, 0.15)'
					},
					{
						key: 'road_tax_upto',
						label: 'ROAD TAX UPTO',
						value: data.road_tax_upto || null,
						type: 'date',
						editable: true,
						icon: 'bi bi-calendar-check',
						iconColor: '#6366f1',
						iconBg: 'rgba(99, 102, 241, 0.15)'
					}
				]
			}
		],
		//-- Schema for this specific entity --
		validationSchema: companyVehicleUpdateSchema,
		//-- Mapping from detail page fields to schema fields --
		validationMapping: {
			name: 'name',
			capacity: 'capacity',
			status: 'status',
			manufactured_on: 'manufactured_on',
			insurance_upto: 'insurance_upto',
			fitness_upto: 'fitness_upto',
			pollution_upto: 'pollution_upto',
			road_tax_upto: 'road_tax_upto'
		},
		//-- Prepare data for validation --
		prepareForValidation: (editableData) => ({
			name: editableData.name || '',
			capacity: editableData.capacity || '',
			status: editableData.status || '',
			manufactured_on: editableData.manufactured_on || '',
			insurance_upto: editableData.insurance_upto || null,
			fitness_upto: editableData.fitness_upto || null,
			pollution_upto: editableData.pollution_upto || null,
			road_tax_upto: editableData.road_tax_upto || null
		}),
		actions: {
			edit: true,
			delete: true
		}
	};
}
