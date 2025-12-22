import type { DetailConfig } from '$lib/types/detail-config';
import type { Company } from '$lib/types/type';
import { companySchema } from '$lib/schemas';


export function getCompanyDetailConfig(data: Company): DetailConfig {
    return {
        title: 'Company Details',
        avatar: {
            initials: data.name.charAt(0).toUpperCase(),
            color: '#3b82f6',
            name: data.name,
            statusText: data.status,
            dashboardLink: `/company/dashboard?name=${encodeURIComponent(data.name)}&id=${encodeURIComponent(data.id)}`,
        },
        sections: [
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
                        iconBg: 'rgba(34, 150, 243, 0.15)',
                        autoFocus: true
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
                    }, {
                        key: 'address',
                        label: 'ADDRESS',
                        value: data.address,
                        type: 'text',
                        editable: true,
                        icon: 'bi bi-geo-alt',
                        iconColor: '#f43f5e',
                        iconBg: 'rgba(244, 63, 94, 0.15)'
                    }
                ]
            },
            {
                title: 'COMPANY DETAILS',
                fields: [
                    {
                        key: 'id',
                        label: 'COMPANY ID',
                        value: data.id,
                        type: 'text',
                        editable: false,
                        icon: 'bi bi-hash',
                        iconColor: '#a56bfd',
                        iconBg: 'rgba(113, 33, 247, 0.18)'
                    },
                    {
                        key: 'ownerName',
                        label: 'OWNER NAME',
                        value: data.ownerName,
                        type: 'text',
                        editable: true,
                        icon: 'bi bi-person',
                        iconColor: '#f97316',
                        iconBg: 'rgba(249, 115, 22, 0.15)'
                    },

                    {
                        key: 'type',
                        label: 'TYPE',
                        value: data.type,
                        type: 'select',
                        editable: true,
                        icon: 'bi bi-building-check',
                        iconColor: '#f43f5e',
                        iconBg: 'rgba(244, 63, 94, 0.15)',
                        options: ['Private', 'Public', 'Government']
                    },
                    {
                        key: 'location',
                        label: 'LOCATION',
                        value: data.location,
                        type: 'text',
                        editable: true,
                        icon: 'bi bi-geo-alt',
                        iconColor: '#f4a63f',
                        iconBg: 'rgba(244, 211, 63, 0.15)'
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
                    }
                ]
            }
        ],
        //-- Schema for this specific entity --
        validationSchema: companySchema,
        //-- Mapping from detail page fields to schema fields --
        validationMapping: {
            name: 'name',
            ownerName: 'ownerName',
            address: 'address',
            location: 'location',
            email: 'email',
            phone: 'phone',
            type: 'type'
        },
        //-- Prepare data for validation (shape must match companySchema) --
        prepareForValidation: (editableData) => ({
            name: editableData.name || '',
            ownerName: editableData.ownerName || '',
            address: editableData.address || '',
            location: editableData.location || '',
            email: editableData.email ?? '',
            phone: editableData.phone ?? '',
            type: editableData.type || ''
        }),
        actions: {
            edit: true,
            delete: true
        }
    };
}
