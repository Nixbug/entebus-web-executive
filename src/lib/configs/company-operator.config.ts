import type { DetailConfig } from '$lib/types/detail-config';
import type { Operator } from '$lib/types/type';
import { operatorAccountSchema } from '$lib/schemas';

export function getOperatorDetailConfig(data: Operator): DetailConfig {
    return {
        title: 'Operator Details',
        avatar: {
            initials: data.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase(),
            color: '#3b82f6',
            name: data.name,
            isActive: data.isActive,
            statusText: data.isActive ? 'Active' : 'Inactive',
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
                    }
                ]
            },
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
                        key: 'password',
                        label: 'PASSWORD',
                        value: data.password ? '********' : '',
                        type: 'text',
                        editable: true,
                        icon: 'bi bi-key',
                        iconColor: '#f43f5e',
                        iconBg: 'rgba(244, 63, 94, 0.15)'
                    },
                    {
                        key: 'name',
                        label: 'FULL NAME',
                        value: data.name,
                        type: 'text',
                        editable: true,
                        icon: 'bi bi-person',
                        iconColor: '#362adf',
                        iconBg: 'rgba(59, 130, 246, 0.18)'
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
        validationSchema: operatorAccountSchema,
        //-- Mapping from detail page fields to schema fields --
        validationMapping: {
            'name': 'fullName',
            'username': 'username',
            'email': 'email',
            'phone': 'phone',
            'gender': 'gender',
        },
        //-- Prepare data for validation --
        prepareForValidation: (editableData) => ({
            password: editableData.password || '',
            fullName: editableData.name || '',
            email: editableData.email || '',
            phone: editableData.phone || '',
            gender: editableData.gender || ''
        }),
        actions: {
            edit: true,
            delete: true
        }
    };
}
