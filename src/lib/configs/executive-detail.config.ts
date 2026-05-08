import type { DetailConfig } from '$lib/types/detail-config';
import type { Executive } from '$lib/types/type';
import { executiveAccountUpdateSchema } from '$lib/schemas';
import { getInitials } from '$lib/helpers';
import {
	fetchExecutiveImageForExecutive,
	fetchExecutiveImage,
	deleteExecutiveImage,
	uploadExecutiveImage,
	clearExecutiveImageCache
} from '$lib/services/executive-image';

export function getExecutiveDetailConfig(
	data: Executive,
	loadRoleOptions?: (
		q?: string,
		limit?: number,
		offset?: number
	) => Promise<Array<{ id: number; name: string }>>,
	canUpdateRole: boolean = false
): DetailConfig {
	return {
		title: 'Executive Details',
		avatar: {
			initials: getInitials(data.initials, data.name, 'EX'),
			color: '#3b82f6',
			name: data.name || 'John Doe',
			designation: data.designation || 'Executive',
			isYou: !!data.isYou,
			isActive: data.isActive !== false,
			loadImage: async (executiveId: number) => {
				try {
					return await fetchExecutiveImageForExecutive(executiveId, { width: 300, height: 300 });
				} catch (e) {
					console.warn('loadImage failed', e);
					return null;
				}
			},
			uploadImage: async (executiveId: number, file: File) => {
				try {
					const list = await fetchExecutiveImage({ executive_id: executiveId });
					const items = Array.isArray(list)
						? list
						: list && (list as any).data
							? (list as any).data
							: [];
					if (items && items.length) {
						const matchedItems = items.filter(
							(it: any) => Number(it?.executive_id) === executiveId
						);
						const itemsMissingExecutiveId = items.filter(
							(it: any) => it?.executive_id == null || it?.executive_id === ''
						);
						const itemsToDelete =
							matchedItems.length > 0
								? matchedItems
								: items.length === 1 && itemsMissingExecutiveId.length === 1
									? items
									: [];
						for (const item of itemsToDelete) {
							const existingId = Number(item.id);
							if (existingId && !Number.isNaN(existingId)) {
								try {
									await deleteExecutiveImage(existingId);
								} catch (e) {
									console.warn('Failed to delete existing executive image', e);
								}
							}
						}
					}
				} catch (e) {
					console.warn('Failed to check existing images before upload', e);
				}
				return await uploadExecutiveImage(file, executiveId);
			},
			deleteImage: async (imageId: number) => {
				return await deleteExecutiveImage(imageId);
			},
			clearImageCache: (executiveId?: number) => {
				try {
					clearExecutiveImageCache(executiveId);
				} catch (e) {
					console.warn('clearImageCache failed', e);
				}
			}
		},
		sections: [
			{
				title: 'EMPLOYEE DETAILS',
				fields: [
					{
						key: 'id',
						label: 'EMPLOYEE ID',
						value: data.id,
						type: 'text',
						editable: false,
						icon: 'bi bi-hash',
						iconColor: '#a56bfd',
						iconBg: 'rgba(113, 33, 247, 0.18)'
					},
					{
						key: 'username',
						label: 'USERNAME',
						value: data.username || '',
						type: 'text',
						editable: false,
						icon: 'bi bi-person-badge',
						iconColor: '#f97316',
						iconBg: 'rgba(249, 115, 22, 0.15)'
					},
					{
						key: 'name',
						label: 'FULL NAME',
						value: data.name,
						type: 'text',
						editable: true,
						icon: 'bi bi-person',
						iconColor: '#362adf',
						iconBg: 'rgba(59, 130, 246, 0.18)',
						autoFocus: true
					},
					{
						key: 'gender',
						label: 'GENDER',
						value: data.gender,
						type: 'select',
						editable: true,
						icon: 'bi bi-gender-ambiguous',
						iconColor: '#db2777',
						iconBg: 'rgba(219, 39, 119, 0.18)',
						options: ['Male', 'Female', 'Transgender', 'Other']
					},
					{
						key: 'status',
						label: 'STATUS',
						value: data.status,
						type: 'select',
						editable: !data.isYou,
						icon: 'bi bi-toggle-on',
						iconColor: '#22c55e',
						iconBg: 'rgba(34, 197, 94, 0.15)',
						options: ['Active', 'Suspended']
					},
					{
						key: 'designation',
						label: 'DESIGNATION',
						value: data.designation,
						type: 'text',
						editable: true,
						icon: 'bi bi-briefcase',
						iconColor: '#ff8c00',
						iconBg: 'rgba(255, 140, 0, 0.15)'
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
						label: 'LAST UPDATED',
						value: data.updatedAt,
						type: 'date',
						editable: false,
						icon: 'bi bi-calendar3',
						iconColor: '#3b82f6',
						iconBg: 'rgba(59, 130, 246, 0.18)'
					}
				]
			},
			{
				title: 'PERMISSION DETAILS',
				fields: [
					{
						key: 'rolesDisplay',
						label: 'ASSIGNED ROLE',
						value: (data as any).rolesDisplay || 'No roles assigned',
						type: 'text',
						editable: false,
						icon: 'bi bi-shield-check',
						iconColor: '#3b82f6',
						iconBg: 'rgba(59, 130, 246, 0.18)',
						visibleWhenEditing: false
					},
					{
						key: 'roleId',
						label: 'ASSIGNED ROLES',
						value: (data as any).roleId || '',
						type: 'searchableSelect',
						editable: true,
						disabled: !canUpdateRole,
						icon: 'bi bi-shield-check',
						iconColor: '#3b82f6',
						iconBg: 'rgba(59, 130, 246, 0.18)',
						loadOptions: loadRoleOptions,
						visibleWhenViewing: false
					}
				]
			},
			{
				title: 'CONTACT INFORMATION',
				fields: [
					{
						key: 'email',
						label: 'EMAIL ADDRESS',
						value: data.email,
						type: 'email',
						editable: true,
						icon: 'bi bi-envelope',
						iconColor: '#2296f3',
						iconBg: 'rgba(34, 150, 243, 0.15)'
					},
					{
						key: 'phone',
						label: 'PHONE NUMBER',
						value: data.phone,
						type: 'phone',
						editable: true,
						icon: 'bi bi-telephone',
						iconColor: '#00b450',
						iconBg: 'rgba(0, 180, 80, 0.15)'
					}
				]
			},
			{
				title: 'SECURITY',
				fields: [
					{
						key: 'password',
						label: 'PASSWORD',
						value: '',
						type: 'text',
						editable: true,
						icon: 'bi bi-key',
						iconColor: '#f43f5e',
						iconBg: 'rgba(244, 63, 94, 0.15)'
					}
				]
			}
		],
		//-- Schema for this specific entity --
		validationSchema: executiveAccountUpdateSchema,
		//-- Mapping from detail page fields to schema fields --
		validationMapping: {
			name: 'fullName',
			email: 'email',
			phone: 'phone',
			gender: 'gender',
			status: 'status',
			designation: 'designation'
		},
		//-- Prepare data for validation --
		prepareForValidation: (editableData) => ({
			password: editableData.password || '',
			fullName: editableData.name || '',
			email: editableData.email || '',
			phone: editableData.phone || '',
			designation: editableData.designation || '',
			gender: editableData.gender || '',
			status: editableData.status || ''
		}),
		actions: {
			edit: true,
			delete: true
		}
	};
}
