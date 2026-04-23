import type { PermissionNodeData } from './build-state';

//---- Defines the hierarchical structure of permissions ----
export const executiveRolePermissionTree: PermissionNodeData[] = [
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
		id: 'company',
		label: 'Company',
		actions: ['create', 'update', 'delete'],
		children: [
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
				id: 'service',
				label: 'Service',
				actions: ['create', 'update', 'delete'],
				children: [
					{
						id: 'duty',
						label: 'Duty',
						actions: ['update']
					},
					{
						id: 'assignment',
						label: 'Assignment',
						actions: ['create', 'update', 'delete']
					},
					{
						id: 'statement',
						label: 'Statement',
						actions: ['create']
					}
				]
			},
			{
				id: 'schedule',
				label: 'Schedule',
				actions: ['create', 'update', 'delete']
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
	}
];

export const operatorRolePermissionTree: PermissionNodeData[] = [
	{
		id: 'company',
		label: 'Company',
		actions: ['update'],
		children: [
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
				id: 'service',
				label: 'Service',
				actions: ['create', 'update', 'delete'],
				children: [
					{
						id: 'duty',
						label: 'Duty',
						actions: ['update'] // only update
					},
					{
						id: 'assignment',
						label: 'Assignment',
						actions: ['create', 'update', 'delete']
					},
					{
						id: 'ticket',
						label: 'Ticket',
						actions: ['create']
					},
					{
						id: 'statement',
						label: 'Statement',
						actions: ['create']
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
