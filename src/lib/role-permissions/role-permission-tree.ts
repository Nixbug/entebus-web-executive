import type { PermissionNodeData } from './build-state';

//---- Defines the hierarchical structure of permissions ----
export const executiveRolePermissionTree: PermissionNodeData[] = [
	{
		id: 'landmark',
		label: 'Landmark',
		actions: ['create', 'update', 'delete'],
		children: [
			{
				id: 'bus_stop',
				label: 'Bus Stop',
				actions: ['create', 'update', 'delete']
			}
		]
	},
	{
		id: 'fare',
		label: 'Fare',
		actions: ['create', 'update', 'delete']
	},
	{
		id: 'executive',
		label: 'Executive',
		actions: ['create', 'update', 'delete'],
		children: [
			{
				id: 'role',
				label: 'Role',
				actions: ['create', 'update', 'delete']
			},
			{
				id: 'token',
				label: 'Token',
				actions: ['fetch', 'delete']
			}
		]
	},
	{
		id: 'business',
		label: 'Business',
		actions: ['create', 'update', 'delete'],
		children: [
			{
				id: 'vendor',
				label: 'Vendor',
				actions: ['create', 'update', 'delete'],
				children: [
					{
						id: 'role',
						label: 'Role',
						actions: ['create', 'update', 'delete']
					},
					{
						id: 'token',
						label: 'Token',
						actions: ['fetch', 'delete']
					}
				]
			}
		]
	},
	{
		id: 'company',
		label: 'Company',
		actions: ['create', 'update', 'delete'],
		children: [
			{
				id: 'vehicle',
				label: 'Vehicle',
				actions: ['create', 'update', 'delete']
			},
			{
				id: 'fare',
				label: 'Fare',
				actions: ['create', 'update', 'delete']
			},
			{
				id: 'route',
				label: 'Route',
				actions: ['create', 'update', 'delete']
			},
			{
				id: 'operator',
				label: 'Operator',
				actions: ['create', 'update', 'delete'],
				children: [
					{
						id: 'role',
						label: 'Role',
						actions: ['create', 'update', 'delete']
					},
					{
						id: 'token',
						label: 'Token',
						actions: ['fetch', 'delete']
					}
				]
			},
			{
				id: 'service',
				label: 'Service',
				actions: ['create', 'update', 'delete'],
				children: [
					{
						id: 'duty',
						label: 'Duty',
						actions: ['create', 'update', 'delete']
					}
				]
			},
			{
				id: 'schedule',
				label: 'Schedule',
				actions: ['create', 'update', 'delete']
			}
		]
	}
];

export const operatorRolePermissionTree: PermissionNodeData[] = [
	{
		id: 'company',
		label: 'Company',
		actions: ['fetch', 'update']
	},
	{
		id: 'bus',
		label: 'Bus',
		actions: ['fetch', 'create', 'update', 'delete']
	},
	{
		id: 'fare',
		label: 'Fare',
		actions: ['fetch', 'create', 'update', 'delete']
	},
	{
		id: 'route',
		label: 'Route',
		actions: ['fetch', 'create', 'update', 'delete']
	},
	{
		id: 'operator',
		label: 'Operator',
		actions: ['fetch', 'create', 'update', 'delete'],
		children: [
			{
				id: 'role',
				label: 'Role',
				actions: ['fetch', 'create', 'update', 'delete']
			},
			{
				id: 'token',
				label: 'Token',
				actions: ['fetch', 'create', 'update', 'delete']
			}
		]
	},
	{
		id: 'service',
		label: 'Service',
		actions: ['fetch', 'create', 'update', 'delete'],
		children: [
			{
				id: 'duty',
				label: 'Duty',
				actions: ['fetch', 'create', 'update', 'delete']
			}
		]
	}
];
