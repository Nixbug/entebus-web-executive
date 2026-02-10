import type { DetailConfig } from '$lib/types/detail-config';
import type { Vehicle } from '$lib/types/type';
import { companyVehicleSchema } from '$lib/schemas';
export function getVehicleDetailConfig(data: Vehicle): DetailConfig {

    return {
        title: 'Vehicle Details',
        avatar: {

            icon: 'bi bi-bus-front-fill',
            color: '#3b82f6',
            name: data.name,
            registrationNumber: data.registrationNumber
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
                        icon: 'bi bi-activity',
                        iconColor: '#db2777',
                        iconBg: 'rgba(219, 39, 119, 0.18)',
                        options: ['Active', 'Maintenance', 'Suspended']
                    },
                    {
                        key: 'manufactured_on',
                        label: 'MANUFACTURED ON',
                        value: data.manufactured_on,
                        type: 'date',
                        editable: true,
                        icon: 'bi bi-gear',
                        iconColor: '#6366f1',
                        iconBg: 'rgba(99, 102, 241, 0.15)'
                    },
                    {
                        key: 'insurance_upto',
                        label: 'INSURANCE UPTO',
                        value: data.insurance_upto,
                        type: 'date',
                        editable: true,
                        icon: 'bi bi-shield-check',
                        iconColor: '#0ea5e9',
                        iconBg: 'rgba(14, 165, 233, 0.15)'
                    },
                    {
                        key: 'fitness_upto',
                        label: 'FITNESS UPTO',
                        value: data.fitness_upto,
                        type: 'date',
                        editable: true,
                        icon: 'bi bi-heart-pulse',
                        iconColor: '#f43f5e',
                        iconBg: 'rgba(244, 63, 94, 0.15)'
                    },
                    {
                        key: 'pollution_upto',
                        label: 'POLLUTION UPTO',
                        value: data.pollution_upto,
                        type: 'date',
                        editable: true,
                        icon: 'bi bi-wind',
                        iconColor: '#fbbf24',
                        iconBg: 'rgba(251, 191, 36, 0.15)'
                    },
                    {
                        key: 'road_tax_upto',
                        label: 'ROAD TAX UPTO',
                        value: data.road_tax_upto,
                        type: 'date',
                        editable: true,
                        icon: 'bi bi-cash-coin',
                        iconColor: '#10b981',
                        iconBg: 'rgba(16, 185, 129, 0.15)'
                    }
                ]
            }
        ],
        //-- Schema for this specific entity --
        validationSchema: companyVehicleSchema,
        //-- Mapping from detail page fields to schema fields --
        validationMapping: {
            name: 'name',
            capacity: 'capacity',
            manufactured_on: 'manufactured_on',
            insurance_upto: 'insurance_upto',
            fitness_upto: 'fitness_upto',
            pollution_upto: 'pollution_upto',
            road_tax_upto: 'road_tax_upto'
        },
        //-- Prepare data for validation --
        prepareForValidation: (editableData) => ({
            name: editableData.name || '',
            capacity: editableData.capacity || 0,
            manufactured_on: editableData.manufactured_on || null,
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
