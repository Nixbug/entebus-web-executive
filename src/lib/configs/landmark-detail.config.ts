import type { DetailConfig } from '$lib/types/detail-config';

export function getLandmarkDetailConfig(data: any): DetailConfig {
    return {
        title: 'Landmark Details',
        avatar: {
            initials: data.initials || 'JD',
            color: '#3b82f6',
            name: data.name || 'John Doe',
            designation: data.designation || 'Executive',
            isYou: data.isYou || false,
            isActive: data.isActive !== false,
        },
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
                        icon: 'bi bi-geo-alt-fill',
                        iconColor: '#db2777',
                        iconBg: 'rgba(219, 39, 119, 0.18)',
                        options: ['All Types', 'Local', 'Village', 'District', 'State', 'National'],
                    },
                    {
                        key: 'name',
                        label: 'NAME',
                        value: data.name,
                        type: 'text',
                        editable: true,
                        icon: 'bi bi-envelope',
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
                        icon: 'bi bi-diagram-3',
                        iconColor: '#f59e0b',
                        iconBg: 'rgba(245, 158, 11, 0.15)',
                    }
                ]
            },
        ],
        //-- Mapping from detail page fields to schema fields --
        validationMapping: {
            name: 'fullName',
            type: 'type',
        },
        //-- Prepare data for validation --
        prepareForValidation: (editableData) => ({
            fullName: editableData.name || '',
            type: editableData.type || '',
        }),
        actions: {
            edit: true,
            delete: true
        }
    };
}
