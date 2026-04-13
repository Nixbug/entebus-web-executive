import type {
	Company,
	Landmark,
	BusStop,
	Operator,
	Vehicle,
	OperatorRole,
	Fare,
	Route,
	LandmarkInRoute
} from './types/type';

function generateRandomPermissionFlag(): boolean {
	return Math.random() > 0.5;
}
function generateCrudPermissions() {
	return {
		create: generateRandomPermissionFlag(),
		update: generateRandomPermissionFlag(),
		delete: generateRandomPermissionFlag(),
		fetch: generateRandomPermissionFlag()
	};
}

function generatePermissions() {
	return {
		landmark: {
			...generateCrudPermissions(),
			bus_stop: {
				...generateCrudPermissions()
			}
		},

		fare: {
			...generateCrudPermissions()
		},

		executive: {
			...generateCrudPermissions(),
			role: {
				...generateCrudPermissions()
			},
			token: {
				...generateCrudPermissions()
			}
		},

		business: {
			...generateCrudPermissions(),
			vendor: {
				...generateCrudPermissions(),
				role: {
					...generateCrudPermissions()
				},
				token: {
					...generateCrudPermissions()
				}
			}
		},

		company: {
			...generateCrudPermissions(),
			bus: {
				...generateCrudPermissions()
			},
			fare: {
				...generateCrudPermissions()
			},
			route: {
				...generateCrudPermissions()
			},
			operator: {
				...generateCrudPermissions(),
				role: {
					...generateCrudPermissions()
				},
				token: {
					...generateCrudPermissions()
				}
			},
			service: {
				...generateCrudPermissions(),
				duty: {
					...generateCrudPermissions()
				}
			}
		}
	};
}

//-- Dummy data: List of landmarks --
export const landmarks: Landmark[] = [
	{
		id: 'LAN-001',
		name: 'Varakala',
		type: 'Local',
		boundary:
			'POLYGON((76.72452503384679 8.735224445138792,76.72697120846837 8.735224445138792,76.72697120846837 8.733018725672231,76.72452503384679 8.733018725672231,76.72452503384679 8.735224445138792))'
	},
	{
		id: 'LAN-002',
		name: 'Kallambalam',
		type: 'Local',
		boundary:
			'POLYGON((76.79130706441629 8.763134311471646,76.79172548902261 8.763134311471646,76.79172548902261 8.762572320554437,76.79130706441629 8.762572320554437,76.79130706441629 8.763134311471646))'
	},
	{
		id: 'LAN-003',
		name: 'Alamcode',
		type: 'Village',
		boundary:
			'POLYGON((76.81271932279982 8.721181464249122,76.81295803940215 8.721181464249122,76.81295803940215 8.721018415595164,76.81271932279982 8.721018415595164,76.81271932279982 8.721181464249122))'
	},
	{
		id: 'LAN-004',
		name: 'Attingal',
		type: 'District',
		boundary:
			'POLYGON((76.81343298675799 8.698649239650083,76.81399625065112 8.698649239650083,76.81399625065112 8.698113665197885,76.81343298675799 8.698113665197885,76.81343298675799 8.698649239650083))'
	},
	{
		id: 'LAN-005',
		name: 'Chirayinkeezhu',
		type: 'District',
		boundary:
			'POLYGON((76.78718052809228 8.655842020222341,76.78997002546777 8.655842020222341,76.78997002546777 8.653338845698373,76.78718052809228 8.653338845698373,76.78718052809228 8.655842020222341))'
	},
	{
		id: 'LAN-006',
		name: 'Mangalapuram',
		type: 'Local',
		boundary:
			'POLYGON((76.84840143820264 8.624378767093209,76.84912027021863 8.624378767093209,76.84912027021863 8.623752922804863,76.84840143820264 8.623752922804863,76.84840143820264 8.624378767093209))'
	},
	{
		id: 'LAN-007',
		name: 'Edappally Toll Zone',
		type: 'District',
		boundary:
			'POLYGON((76.3050 10.0200,76.3200 10.0200,76.3200 10.0350,76.3050 10.0350,76.3050 10.0200))'
	},
	{
		id: 'LAN-008',
		name: 'Thrissur Round Area',
		type: 'Local',
		boundary:
			'POLYGON((76.2100 10.5150,76.2250 10.5150,76.2250 10.5300,76.2100 10.5300,76.2100 10.5150))'
	},
	{
		id: 'LAN-009',
		name: 'Guruvayur Temple Zone',
		type: 'State',
		boundary:
			'POLYGON((76.0400 10.5900,76.0550 10.5900,76.0550 10.6050,76.0400 10.6050,76.0400 10.5900))'
	},
	{
		id: 'LAN-010',
		name: 'Kozhikode Beach Road',
		type: 'State',
		boundary:
			'POLYGON((75.7600 11.2450,75.7750 11.2450,75.7750 11.2600,75.7600 11.2600,75.7600 11.2450))'
	}
];

//-- Dummy data: List of global fares --
export const globalFares: Fare[] = [
	{
		id: 'GFARE-001',
		version: 2,
		name: 'Kerala Stage Fare',
		attributes: {
			df_version: 1,
			ticket_types: [
				{
					id: 1,
					name: 'Adult'
				},
				{
					id: 2,
					name: 'Child'
				},
				{
					id: 3,
					name: 'Handicapped'
				}
			],
			currency_type: 'INR',
			distance_unit: 'm',
			extra: {}
		},
		function: `function getFare(ticket_type, distance, extra) {
  const base_fare_distance = 2.5;
  const base_fare = 10;
  const rate_per_km = 1;

  distance = distance / 1000;

  if (ticket_type == "Adult") {
    if (distance <= base_fare_distance) return base_fare;
    else return base_fare + ((distance - base_fare_distance) * rate_per_km);
  }

  if (ticket_type == "Child") {
    if (distance <= base_fare_distance) return base_fare / 2;
    else return (base_fare + ((distance - base_fare_distance) * rate_per_km)) / 2;
  }
    if (ticket_type == "Handicapped") {
    if (distance <= base_fare_distance) return base_fare / 2;
    else return (base_fare + ((distance - base_fare_distance) * rate_per_km)) / 2;
  }
  return -1;
}`,
		updated_on: '2025-10-25T05:15:00.375387Z',
		created_on: '2025-10-25T05:14:53.462506Z'
	},
	{
		id: 'GFARE-002',
		version: 1,
		name: 'Tamil Nadu Stage Fare',
		attributes: {
			df_version: 1,
			ticket_types: [
				{
					id: 1,
					name: 'Adult'
				},
				{
					id: 2,
					name: 'Child'
				},
				{
					id: 3,
					name: 'Student'
				}
			],
			currency_type: 'USD',
			distance_unit: 'm',
			extra: {}
		},
		function: `function getFare(ticket_type, distance, extra) {
  const base_fare_distance = 2.5;
  const base_fare = 10;
  const rate_per_km = 1;

  distance = distance / 1000;

  if (ticket_type == "Adult") {
    if (distance <= base_fare_distance) return base_fare;
    else return base_fare + ((distance - base_fare_distance) * rate_per_km);
  }

  if (ticket_type == "Child") {
    if (distance <= base_fare_distance) return base_fare / 2;
    else return (base_fare + ((distance - base_fare_distance) * rate_per_km)) / 2;
  }
    if (ticket_type == "Student") {
    if (distance <= base_fare_distance) return base_fare / 2;
    else return (base_fare + ((distance - base_fare_distance) * rate_per_km)) / 2;
  }
  return -1;
}`,
		updated_on: '2025-10-25T05:15:00.375387Z',
		created_on: '2025-10-25T05:14:53.462506Z'
	}
];
//-- Dummy data: List of vehicles --
export const vehicles: Vehicle[] = [
	{
		id: 'VEH-001',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1234',
		name: 'Krishna Bus',
		capacity: 50,
		manufactured_on: '2024-01-10T06:17:06.399Z',
		insurance_upto: '2026-01-10T06:17:06.399Z',
		fitness_upto: '2026-01-10T06:17:06.399Z',
		pollution_upto: '2025-07-10T06:17:06.399Z',
		road_tax_upto: '2027-01-10T06:17:06.399Z',
		status: 'ACTIVE'
	},
	{
		id: 'VEH-002',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1235',
		name: 'RKV Bus',
		capacity: 45,
		manufactured_on: '2023-06-12T06:17:06.399Z',
		insurance_upto: '2025-06-12T06:17:06.399Z',
		fitness_upto: '2025-06-12T06:17:06.399Z',
		pollution_upto: '2025-03-12T06:17:06.399Z',
		road_tax_upto: '2026-06-12T06:17:06.399Z',
		status: 'MAINTENANCE'
	},
	{
		id: 'VEH-003',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1236',
		name: 'City Rider',
		capacity: 40,
		manufactured_on: '2022-11-01T06:17:06.399Z',
		insurance_upto: '2024-11-01T06:17:06.399Z',
		fitness_upto: '2024-11-01T06:17:06.399Z',
		pollution_upto: '2024-05-01T06:17:06.399Z',
		road_tax_upto: '2025-11-01T06:17:06.399Z',
		status: 'SUSPENDED'
	},
	{
		id: 'VEH-004',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1237',
		name: 'Metro Express',
		capacity: 55,
		manufactured_on: '2021-03-15T06:17:06.399Z',
		insurance_upto: '2025-03-15T06:17:06.399Z',
		fitness_upto: '2025-03-15T06:17:06.399Z',
		pollution_upto: '2024-09-15T06:17:06.399Z',
		road_tax_upto: '2026-03-15T06:17:06.399Z',
		status: 'ACTIVE'
	},
	{
		id: 'VEH-005',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1238',
		name: 'Super Deluxe',
		capacity: 48,
		manufactured_on: '2020-08-20T06:17:06.399Z',
		insurance_upto: '2024-08-20T06:17:06.399Z',
		fitness_upto: '2024-08-20T06:17:06.399Z',
		pollution_upto: '2024-02-20T06:17:06.399Z',
		road_tax_upto: '2025-08-20T06:17:06.399Z',
		status: 'ACTIVE'
	},
	{
		id: 'VEH-006',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1239',
		name: 'Night Rider',
		capacity: 42,
		manufactured_on: '2023-02-10T06:17:06.399Z',
		insurance_upto: '2025-02-10T06:17:06.399Z',
		fitness_upto: '2025-02-10T06:17:06.399Z',
		pollution_upto: '2024-08-10T06:17:06.399Z',
		road_tax_upto: '2026-02-10T06:17:06.399Z',
		status: 'ACTIVE'
	},
	{
		id: 'VEH-007',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1240',
		name: 'Coastal Line',
		capacity: 50,
		manufactured_on: '2022-12-05T06:17:06.399Z',
		insurance_upto: '2024-12-05T06:17:06.399Z',
		fitness_upto: '2024-12-05T06:17:06.399Z',
		pollution_upto: '2024-06-05T06:17:06.399Z',
		road_tax_upto: '2025-12-05T06:17:06.399Z',
		status: 'MAINTENANCE'
	},
	{
		id: 'VEH-008',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1241',
		name: 'Hill Topper',
		capacity: 44,
		manufactured_on: '2021-07-18T06:17:06.399Z',
		insurance_upto: '2025-07-18T06:17:06.399Z',
		fitness_upto: '2025-07-18T06:17:06.399Z',
		pollution_upto: '2024-12-18T06:17:06.399Z',
		road_tax_upto: '2026-07-18T06:17:06.399Z',
		status: 'ACTIVE'
	},
	{
		id: 'VEH-009',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1242',
		name: 'Express Line',
		capacity: 52,
		manufactured_on: '2023-09-30T06:17:06.399Z',
		insurance_upto: '2025-09-30T06:17:06.399Z',
		fitness_upto: '2025-09-30T06:17:06.399Z',
		pollution_upto: '2025-03-30T06:17:06.399Z',
		road_tax_upto: '2026-09-30T06:17:06.399Z',
		status: 'ACTIVE'
	},
	{
		id: 'VEH-010',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1243',
		name: 'Town Shuttle',
		capacity: 38,
		manufactured_on: '2020-04-22T06:17:06.399Z',
		insurance_upto: '2024-04-22T06:17:06.399Z',
		fitness_upto: '2024-04-22T06:17:06.399Z',
		pollution_upto: '2024-01-22T06:17:06.399Z',
		road_tax_upto: '2025-04-22T06:17:06.399Z',
		status: 'SUSPENDED'
	},
	{
		id: 'VEH-011',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1244',
		name: 'Airport Link',
		capacity: 60,
		manufactured_on: '2023-05-14T06:17:06.399Z',
		insurance_upto: '2025-05-14T06:17:06.399Z',
		fitness_upto: '2025-05-14T06:17:06.399Z',
		pollution_upto: '2024-11-14T06:17:06.399Z',
		road_tax_upto: '2026-05-14T06:17:06.399Z',
		status: 'ACTIVE'
	},
	{
		id: 'VEH-012',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1245',
		name: 'City Hopper',
		capacity: 36,
		manufactured_on: '2022-10-10T06:17:06.399Z',
		insurance_upto: '2024-10-10T06:17:06.399Z',
		fitness_upto: '2024-10-10T06:17:06.399Z',
		pollution_upto: '2024-04-10T06:17:06.399Z',
		road_tax_upto: '2025-10-10T06:17:06.399Z',
		status: 'MAINTENANCE'
	},
	{
		id: 'VEH-013',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1246',
		name: 'Blue Line',
		capacity: 47,
		manufactured_on: '2021-01-05T06:17:06.399Z',
		insurance_upto: '2025-01-05T06:17:06.399Z',
		fitness_upto: '2025-01-05T06:17:06.399Z',
		pollution_upto: '2024-07-05T06:17:06.399Z',
		road_tax_upto: '2026-01-05T06:17:06.399Z',
		status: 'ACTIVE'
	},
	{
		id: 'VEH-014',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1247',
		name: 'Red Cruiser',
		capacity: 49,
		manufactured_on: '2022-03-03T06:17:06.399Z',
		insurance_upto: '2026-03-03T06:17:06.399Z',
		fitness_upto: '2026-03-03T06:17:06.399Z',
		pollution_upto: '2025-09-03T06:17:06.399Z',
		road_tax_upto: '2027-03-03T06:17:06.399Z',
		status: 'ACTIVE'
	},
	{
		id: 'VEH-015',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1248',
		name: 'Sunrise Bus',
		capacity: 41,
		manufactured_on: '2020-11-11T06:17:06.399Z',
		insurance_upto: '2024-11-11T06:17:06.399Z',
		fitness_upto: '2024-11-11T06:17:06.399Z',
		pollution_upto: '2024-05-11T06:17:06.399Z',
		road_tax_upto: '2025-11-11T06:17:06.399Z',
		status: 'SUSPENDED'
	},
	{
		id: 'VEH-016',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1249',
		name: 'Night Express',
		capacity: 53,
		manufactured_on: '2023-08-08T06:17:06.399Z',
		insurance_upto: '2025-08-08T06:17:06.399Z',
		fitness_upto: '2025-08-08T06:17:06.399Z',
		pollution_upto: '2025-02-08T06:17:06.399Z',
		road_tax_upto: '2026-08-08T06:17:06.399Z',
		status: 'ACTIVE'
	},
	{
		id: 'VEH-017',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1250',
		name: 'Intercity Coach',
		capacity: 58,
		manufactured_on: '2021-09-09T06:17:06.399Z',
		insurance_upto: '2025-09-09T06:17:06.399Z',
		fitness_upto: '2025-09-09T06:17:06.399Z',
		pollution_upto: '2025-03-09T06:17:06.399Z',
		road_tax_upto: '2026-09-09T06:17:06.399Z',
		status: 'ACTIVE'
	},
	{
		id: 'VEH-018',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1251',
		name: 'Green Line',
		capacity: 46,
		manufactured_on: '2022-02-02T06:17:06.399Z',
		insurance_upto: '2026-02-02T06:17:06.399Z',
		fitness_upto: '2026-02-02T06:17:06.399Z',
		pollution_upto: '2025-08-02T06:17:06.399Z',
		road_tax_upto: '2027-02-02T06:17:06.399Z',
		status: 'MAINTENANCE'
	},
	{
		id: 'VEH-019',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1252',
		name: 'Rapid Transit',
		capacity: 54,
		manufactured_on: '2023-12-12T06:17:06.399Z',
		insurance_upto: '2025-12-12T06:17:06.399Z',
		fitness_upto: '2025-12-12T06:17:06.399Z',
		pollution_upto: '2025-06-12T06:17:06.399Z',
		road_tax_upto: '2026-12-12T06:17:06.399Z',
		status: 'ACTIVE'
	},
	{
		id: 'VEH-020',
		companyId: 'COMP-001',
		registrationNumber: 'KL-01-AB-1253',
		name: 'Metro Shuttle',
		capacity: 39,
		manufactured_on: '2021-05-05T06:17:06.399Z',
		insurance_upto: '2025-05-05T06:17:06.399Z',
		fitness_upto: '2025-05-05T06:17:06.399Z',
		pollution_upto: '2024-11-05T06:17:06.399Z',
		road_tax_upto: '2026-05-05T06:17:06.399Z',
		status: 'ACTIVE'
	}
];

//-- Dummy data: List of operator roles --
export const operatorRoles: OperatorRole[] = [
	{
		id: 'ROLE-001',
		name: 'System Administrator',
		companyId: 'COMP-001',
		permissions: generatePermissions(),
		createdAt: 'Jan 02, 2024',
		updatedAt: 'Jan 05, 2024'
	},
	{
		id: 'ROLE-002',
		name: 'Guest Role',
		companyId: 'COMP-001',
		permissions: generatePermissions(),
		createdAt: 'Jan 03, 2024',
		updatedAt: 'Jan 04, 2024'
	},
	{
		id: 'ROLE-003',
		name: 'Executive Manager',
		companyId: 'COMP-001',
		permissions: generatePermissions(),
		createdAt: 'Jan 06, 2024',
		updatedAt: 'Jan 06, 2024'
	},
	{
		id: 'ROLE-004',
		name: 'Operations Lead',
		companyId: 'COMP-001',
		permissions: generatePermissions(),
		createdAt: 'Jan 07, 2024',
		updatedAt: 'Jan 09, 2024'
	},
	{
		id: 'ROLE-005',
		name: 'HR Supervisor',
		companyId: 'COMP-001',
		permissions: generatePermissions(),
		createdAt: 'Jan 08, 2024',
		updatedAt: 'Jan 11, 2024'
	},
	{
		id: 'ROLE-006',
		name: 'Finance Controller',
		companyId: 'COMP-001',
		permissions: generatePermissions(),
		createdAt: 'Jan 10, 2024',
		updatedAt: 'Jan 12, 2024'
	},
	{
		id: 'ROLE-007',
		name: 'Support Specialist',
		companyId: 'COMP-001',
		permissions: generatePermissions(),
		createdAt: 'Jan 11, 2024',
		updatedAt: 'Jan 14, 2024'
	},
	{
		id: 'ROLE-008',
		name: 'Project Coordinator',
		companyId: 'COMP-001',
		permissions: generatePermissions(),
		createdAt: 'Jan 12, 2024',
		updatedAt: 'Jan 13, 2024'
	},
	{
		id: 'ROLE-009',
		name: 'Technical Lead',
		companyId: 'COMP-001',
		permissions: generatePermissions(),
		createdAt: 'Jan 14, 2024',
		updatedAt: 'Jan 16, 2024'
	},
	{
		id: 'ROLE-010',
		name: 'QA Analyst',
		companyId: 'COMP-001',
		permissions: generatePermissions(),
		createdAt: 'Jan 15, 2024',
		updatedAt: 'Jan 17, 2024'
	}
];

//-- Dummy data: List of company fares --
export const localFares: Fare[] = [
	{
		id: 'LFARE-001',
		companyId: 'COMP-001',
		version: 2,
		name: 'Local Fare',
		attributes: {
			df_version: 1,
			ticket_types: [
				{
					id: 1,
					name: 'Adult'
				},
				{
					id: 2,
					name: 'Child'
				},
				{
					id: 3,
					name: 'Handicapped'
				}
			],
			currency_type: 'INR',
			distance_unit: 'm',
			extra: {}
		},
		function: `function getFare(ticket_type, distance, extra) {
  const base_fare_distance = 2.5;
  const base_fare = 10;
  const rate_per_km = 1;

  distance = distance / 1000;

  if (ticket_type == "Adult") {
    if (distance <= base_fare_distance) return base_fare;
    else return base_fare + ((distance - base_fare_distance) * rate_per_km);
  }

  if (ticket_type == "Child") {
    if (distance <= base_fare_distance) return base_fare / 2;
    else return (base_fare + ((distance - base_fare_distance) * rate_per_km)) / 2;
  }
    if (ticket_type == "Handicapped") {
    if (distance <= base_fare_distance) return base_fare / 2;
    else return (base_fare + ((distance - base_fare_distance) * rate_per_km)) / 2;
  }
  return -1;
}`,
		updated_on: '2025-10-25T05:15:00.375387Z',
		created_on: '2025-10-25T05:14:53.462506Z'
	},
	{
		id: 'LFARE-002',
		companyId: 'COMP-001',
		version: 1,
		name: 'RKV Fare',
		attributes: {
			df_version: 1,
			ticket_types: [
				{
					id: 1,
					name: 'Adult'
				},
				{
					id: 2,
					name: 'Child'
				},
				{
					id: 3,
					name: 'Student'
				}
			],
			currency_type: 'INR',
			distance_unit: 'm',
			extra: {}
		},
		function: `function getFare(ticket_type, distance, extra) {
  const base_fare_distance = 2.5;
  const base_fare = 10;
  const rate_per_km = 1;

  distance = distance / 1000;

  if (ticket_type == "Adult") {
    if (distance <= base_fare_distance) return base_fare;
    else return base_fare + ((distance - base_fare_distance) * rate_per_km);
  }

  if (ticket_type == "Child") {
    if (distance <= base_fare_distance) return base_fare / 2;
    else return (base_fare + ((distance - base_fare_distance) * rate_per_km)) / 2;
  }
    if (ticket_type == "Student") {
    if (distance <= base_fare_distance) return base_fare / 2;
    else return (base_fare + ((distance - base_fare_distance) * rate_per_km)) / 2;
  }
  return -1;
}`,
		updated_on: '2025-10-25T05:15:00.375387Z',
		created_on: '2025-10-25T05:14:53.462506Z'
	}
];

//-- Dummy data: List of routes --
export const routes: Route[] = [
	{
		id: 'ROUTE-001',
		companyId: 'COMP-001',
		name: 'Varkala - Mangalapuram',
		startingTime: '10.00 AM',
		status: 'VALID'
	},
	{
		id: 'ROUTE-002',
		companyId: 'COMP-001',
		name: 'Technopark - Attingal',
		startingTime: '11.00 AM',
		status: 'VALID'
	},
	{
		id: 'ROUTE-003',
		companyId: 'COMP-001',
		name: 'Thiruvananthapuram - Varkala',
		startingTime: '12.00 PM',
		status: 'VALID'
	},
	{
		id: 'ROUTE-004',
		companyId: 'COMP-001',
		name: 'Kochi - Aluva',
		startingTime: '01.00 PM',
		status: 'VALID'
	},
	{
		id: 'ROUTE-005',
		companyId: 'COMP-001',
		name: 'Ernakulam - Kakkanad',
		startingTime: '02.00 PM',
		status: 'VALID'
	},
	{
		id: 'ROUTE-006',
		companyId: 'COMP-001',
		name: 'Kollam - Karunagappally',
		startingTime: '03.00 PM',
		status: 'INVALID'
	}
];

//-- Dummy data: List of landmark in routes --
export const landmarksInRoutes: LandmarkInRoute[] = [
	{
		id: 'LIR-001',
		landmarkId: 'LAN-001',
		routeId: 'ROUTE-001',
		distanceFromStart: 0,
		arrivalDelta: 0,
		departureDelta: 0
	},
	{
		id: 'LIR-002',
		landmarkId: 'LAN-002',
		routeId: 'ROUTE-001',
		distanceFromStart: 1000,
		arrivalDelta: 600,
		departureDelta: 660
	},
	{
		id: 'LIR-003',
		landmarkId: 'LAN-003',
		routeId: 'ROUTE-001',
		distanceFromStart: 2000,
		arrivalDelta: 1200,
		departureDelta: 1260
	},
	{
		id: 'LIR-004',
		landmarkId: 'LAN-004',
		routeId: 'ROUTE-001',
		distanceFromStart: 3000,
		arrivalDelta: 1800,
		departureDelta: 1860
	},
	{
		id: 'LIR-005',
		landmarkId: 'LAN-005',
		routeId: 'ROUTE-001',
		distanceFromStart: 4000,
		arrivalDelta: 2400,
		departureDelta: 2460
	},
	{
		id: 'LIR-006',
		landmarkId: 'LAN-006',
		routeId: 'ROUTE-001',
		distanceFromStart: 5000,
		arrivalDelta: 59600,
		departureDelta: 59600
	}
];
