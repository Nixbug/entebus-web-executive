import type { DetailConfig } from '$lib/types/detail-config';
import type { Operator } from '$lib/types/type';
import { operatorAccountUpdateSchema } from '$lib/schemas';
import { getInitials } from '$lib/helpers';
import {
	fetchOperatorImageForOperator,
	fetchOperatorImage,
	deleteOperatorImage,
	uploadOperatorImage,
	clearOperatorImageCache
} from '$lib/services/operator-image';

export function getOperatorDetailConfig(
	data: Operator,
	loadOperatorRoleOptions?: (
		q?: string,
		limit?: number,
		offset?: number
	) => Promise<Array<{ id: number; name: string }>>,
	canUpdateOperatorRole: boolean = false
): DetailConfig {
	return {
		title: 'Operator Details',
		avatar: {
			initials: getInitials(data.initials, data.name, 'OP'),
			color: '#3b82f6',
			name: data.name,
			isActive: data.isActive !== false,
			loadImage: async (operatorId: number) => {
				try {
					return await fetchOperatorImageForOperator(operatorId, { width: 300, height: 300 });
				} catch (e) {
					console.warn('loadImage failed', e);
					return null;
				}
			},
			uploadImage: async (operatorId: number, file: File) => {
				try {
					const list = await fetchOperatorImage({ operator_id: operatorId });
					const items = Array.isArray(list)
						? list
						: list && (list as any).data
							? (list as any).data
							: [];
					if (items && items.length) {
						const matchedItems = items.filter((it: any) => Number(it?.operator_id) === operatorId);
						const itemsMissingOperatorId = items.filter(
							(it: any) => it?.operator_id == null || it?.operator_id === ''
						);
						const itemsToDelete =
							matchedItems.length > 0
								? matchedItems
								: items.length === 1 && itemsMissingOperatorId.length === 1
									? items
									: [];
						for (const item of itemsToDelete) {
							const existingId = Number(item.id);
							if (existingId && !Number.isNaN(existingId)) {
								try {
									await deleteOperatorImage(existingId);
								} catch (e) {
									console.warn('Failed to delete existing operator image', e);
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
				return await uploadOperatorImage(file, operatorId, companyId);
			},
			deleteImage: async (imageId: number) => {
				return await deleteOperatorImage(imageId);
			},
			clearImageCache: (operatorId?: number) => {
				try {
					clearOperatorImageCache(operatorId);
				} catch (e) {
					console.warn('clearImageCache failed', e);
				}
			}
		},
		sections: [
			{
				title: 'OPERATOR DETAILS',
				fields: [
					{
						key: 'id',
						label: 'OPERATOR ID',
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
						key: 'type',
						label: 'TYPE',
						value: data.type,
						type: 'select',
						editable: true,
						icon: 'bi bi-person-badge',
						iconColor: '#f97316',
						iconBg: 'rgba(249, 115, 22, 0.15)',
						options: ['Normal', 'Owner', 'Manager', 'HR', 'Legal', 'Admin', 'Bot']
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
						options: ['Active', 'Suspended']
					},
					{
						key: 'description',
						label: 'DESCRIPTION',
						value: data.description,
						type: 'text',
						editable: true,
						icon: 'bi bi-card-text',
						iconColor: '#6b7280',
						iconBg: 'rgba(107, 114, 128, 0.18)'
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
						value: data.updatedAt || '',
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
						disabled: !canUpdateOperatorRole,
						icon: 'bi bi-shield-check',
						iconColor: '#3b82f6',
						iconBg: 'rgba(59, 130, 246, 0.18)',
						loadOptions: loadOperatorRoleOptions,
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
		validationSchema: operatorAccountUpdateSchema,
		//-- Mapping from detail page fields to schema fields --
		validationMapping: {
			name: 'fullName',
			email: 'email',
			phone: 'phone',
			gender: 'gender',
			password: 'password',
			type: 'type',
			status: 'status',
			description: 'description'
		},
		//-- Prepare data for validation --
		prepareForValidation: (editableData) => ({
			password: editableData.password || '',
			fullName: editableData.name || '',
			email: editableData.email || '',
			phone: editableData.phone || '',
			gender: editableData.gender || '',
			type: editableData.type || '',
			status: editableData.status || '',
			description: editableData.description || ''
		}),
		actions: {
			edit: true,
			delete: true
		}
	};
}
