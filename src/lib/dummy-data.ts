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

//-- Dummy data: List of companies --
export const companies: Company[] = [
	{
		id: 'COMP-001',
		name: 'Tata Consultancy',
		ownerName: 'Ratan Tata',
		location: 'Mumbai',
		address: 'TCS House, Raveline St, Fort, Mumbai, Maharashtra',
		email: 'contact@tcs.com',
		phone: '+91-22-6778-1234',
		status: 'Verified',
		type: 'Public',
		createdAt: '2025-10-26 06:52:16',
		updatedAt: '2026-04-13 06:52:16'
	},
	{
		id: 'COMP-002',
		name: 'Infosys Ltd',
		ownerName: 'N. R. Narayana Murthy',
		location: 'Bengaluru',
		address: 'Electronics City, Hosur Road, Bengaluru, Karnataka',
		email: 'info@infosys.com',
		phone: '+91-80-2852-1234',
		status: 'Verified',
		type: 'Public',
		createdAt: '2025-10-21 22:27:57',
		updatedAt: '2026-03-08 22:27:57'
	},
	{
		id: 'COMP-003',
		name: 'Wipro Ltd',
		ownerName: 'Azim Premji',
		location: 'Bengaluru',
		address: 'Sarjapur Road, Bengaluru, Karnataka',
		email: 'support@wipro.com',
		phone: '+91-80-2844-5678',
		status: 'Suspended',
		type: 'Public',
		createdAt: '2025-10-15 06:02:38',
		updatedAt: '2026-02-01 06:02:38'
	},
	{
		id: 'COMP-004',
		name: 'HCL Technologies',
		ownerName: 'Shiv Nadar',
		location: 'Noida',
		address: 'HCL Towers, Sector 16, Noida, Uttar Pradesh',
		email: 'contact@hcl.com',
		phone: '+91-120-123-4567',
		status: 'Verified',
		type: 'Public',
		createdAt: '2024-12-11 20:34:39',
		updatedAt: '2024-12-31 20:34:39'
	},
	{
		id: 'COMP-005',
		name: 'Larsen & Toubro Infotech',
		ownerName: 'S. N. Subrahmanyan',
		location: 'Mumbai',
		address: 'L&T House, Ballard Estate, Mumbai, Maharashtra',
		email: 'hello@lntinfotech.com',
		phone: '+91-22-2345-6789',
		status: 'Validating',
		type: 'Private',
		createdAt: '2024-12-28 18:03:36',
		updatedAt: '2025-02-24 18:03:36'
	},
	{
		id: 'COMP-006',
		name: 'Tech Mahindra',
		ownerName: 'CP Gurnani',
		location: 'Pune',
		address: 'Magarpatta City, Pune, Maharashtra',
		email: 'contact@techmahindra.com',
		phone: '+91-20-4010-1234',
		status: 'Verified',
		type: 'Private',
		createdAt: '2024-12-20 11:37:02',
		updatedAt: '2025-05-18 11:37:02'
	},
	{
		id: 'COMP-007',
		name: 'Mindtree Ltd',
		ownerName: 'Krishnakumar N.',
		location: 'Bengaluru',
		address: 'Global Village, Whitefield, Bengaluru, Karnataka',
		email: 'support@mindtree.com',
		phone: '+91-80-6700-5678',
		status: 'Validating',
		type: 'Private',
		createdAt: '2025-09-06 19:17:59',
		updatedAt: '2025-11-21 19:17:59'
	},
	{
		id: 'COMP-008',
		name: 'Reliance Industries Ltd',
		ownerName: 'Mukesh Ambani',
		location: 'Mumbai',
		address: 'Reliance Corporate Park, Santacruz, Mumbai, Maharashtra',
		email: 'info@ril.com',
		phone: '+91-22-3303-5678',
		status: 'Verified',
		type: 'Public',
		createdAt: '2025-01-22 23:05:10',
		updatedAt: '2025-05-02 23:05:10'
	},
	{
		id: 'COMP-009',
		name: 'Bharti Airtel',
		ownerName: 'Sunil Bharti Mittal',
		location: 'Gurugram',
		address: 'Airtel Center, Sector 21, Gurugram, Haryana',
		email: 'contact@airtel.com',
		phone: '+91-124-456-7890',
		status: 'Verified',
		type: 'Public',
		createdAt: '2025-08-12 05:07:04',
		updatedAt: '2025-10-05 05:07:04'
	},
	{
		id: 'COMP-010',
		name: 'Axis Bank',
		ownerName: 'Amitabh Chaudhry',
		location: 'Mumbai',
		address: 'Axis House, Worli, Mumbai, Maharashtra',
		email: 'support@axisbank.com',
		phone: '+91-22-2425-6789',
		status: 'Verified',
		type: 'Public',
		createdAt: '2025-03-21 05:31:49',
		updatedAt: '2025-08-24 05:31:49'
	},
	{
		id: 'COMP-011',
		name: 'ICICI Bank',
		ownerName: 'Sandeep Bakhshi',
		location: 'Mumbai',
		address: 'ICICI Tower, Bandra Kurla Complex, Mumbai, Maharashtra',
		email: 'contact@icicibank.com',
		phone: '+91-22-2656-7890',
		status: 'Suspended',
		type: 'Public',
		createdAt: '2025-01-02 18:41:57',
		updatedAt: '2025-04-11 18:41:57'
	},
	{
		id: 'COMP-012',
		name: 'HDFC Bank',
		ownerName: 'Sashidhar Jagdishan',
		location: 'Mumbai',
		address: 'HDFC Bank House, Senapati Bapat Marg, Mumbai, Maharashtra',
		email: 'info@hdfcbank.com',
		phone: '+91-22-6160-1234',
		status: 'Verified',
		type: 'Public',
		createdAt: '2025-01-11 18:55:31',
		updatedAt: '2025-01-16 18:55:31'
	},
	{
		id: 'COMP-013',
		name: 'Maruti Suzuki',
		ownerName: 'Kenichi Ayukawa',
		location: 'Gurugram',
		address: 'Maruti Suzuki HQ, Gurugram, Haryana',
		email: 'support@marutisuzuki.com',
		phone: '+91-124-234-5678',
		status: 'Validating',
		type: 'Private',
		createdAt: '2025-10-04 04:11:56',
		updatedAt: '2025-11-09 04:11:56'
	},
	{
		id: 'COMP-014',
		name: 'Bajaj Auto',
		ownerName: 'Rahul Bajaj',
		location: 'Pune',
		address: 'Bajaj Auto Ltd, Akurdi, Pune, Maharashtra',
		email: 'contact@bajajauto.com',
		phone: '+91-20-3050-1234',
		status: 'Suspended',
		type: 'Private',
		createdAt: '2025-01-02 14:24:06',
		updatedAt: '2025-04-04 14:24:06'
	},
	{
		id: 'COMP-015',
		name: 'Adani Enterprises',
		ownerName: 'Gautam Adani',
		location: 'Ahmedabad',
		address: 'Adani House, Ashram Road, Ahmedabad, Gujarat',
		email: 'info@adani.com',
		phone: '+91-79-6789-1234',
		status: 'Validating',
		type: 'Private',
		createdAt: '2025-03-16 23:14:43',
		updatedAt: '2025-04-15 23:14:43'
	},
	{
		id: 'COMP-016',
		name: 'Vedanta Ltd',
		ownerName: 'Anil Agarwal',
		location: 'Mumbai',
		address: 'Vedanta Corporate Office, Worli, Mumbai, Maharashtra',
		email: 'support@vedanta.com',
		phone: '+91-22-4000-5678',
		status: 'Verified',
		type: 'Public',
		createdAt: '2025-08-22 03:42:10',
		updatedAt: '2025-12-17 03:42:10'
	},
	{
		id: 'COMP-017',
		name: 'Godrej Industries',
		ownerName: 'Adi Godrej',
		location: 'Mumbai',
		address: 'Godrej One, Pirojshanagar, Vikhroli, Mumbai, Maharashtra',
		email: 'contact@godrej.com',
		phone: '+91-22-6789-4321',
		status: 'Validating',
		type: 'Private',
		createdAt: '2025-01-08 21:16:12',
		updatedAt: '2025-06-27 21:16:12'
	},
	{
		id: 'COMP-018',
		name: 'Asian Paints',
		ownerName: 'V. G. Siddhartha',
		location: 'Mumbai',
		address: 'Asian Paints Ltd, Santacruz, Mumbai, Maharashtra',
		email: 'info@asianpaints.com',
		phone: '+91-22-3050-6789',
		status: 'Validating',
		type: 'Private',
		createdAt: '2025-11-24 19:38:50',
		updatedAt: '2026-01-29 19:38:50'
	},
	{
		id: 'COMP-019',
		name: 'ICICI Prudential',
		ownerName: 'Sandeep Bakhshi',
		location: 'Mumbai',
		address: 'ICICI Prudential HQ, Bandra Kurla Complex, Mumbai, Maharashtra',
		email: 'support@iciciprulife.com',
		phone: '+91-22-6160-7890',
		status: 'Validating',
		type: 'Private',
		createdAt: '2025-11-28 23:38:22',
		updatedAt: '2026-04-24 23:38:22'
	},
	{
		id: 'COMP-020',
		name: 'Hindustan Unilever',
		ownerName: 'Sanjiv Mehta',
		location: 'Mumbai',
		address: 'Unilever House, Andheri East, Mumbai, Maharashtra',
		email: 'info@hul.co.in',
		phone: '+91-22-6789-1230',
		status: 'Validating',
		type: 'Public',
		createdAt: '2025-06-08 05:13:30',
		updatedAt: '2025-10-27 05:13:30'
	}
];

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

//-- Dummy data: List of bus stops --
export const busStops: BusStop[] = [
	{
		id: 'BS 001',
		name: 'Palayam Bus Stop',
		landmarkId: 'LAN-001',
		location: 'POINT(76.9515 8.5115)'
	},
	{
		id: 'BS 002',
		name: 'Palayam Bus Stop 2',
		landmarkId: 'LAN-001',
		location: 'POINT(76.9530 8.5130)'
	},
	{
		id: 'BS 003',
		name: 'Kollam Beach Stop',
		landmarkId: 'LAN-003',
		location: 'POINT(76.5775 8.8875)'
	},
	{
		id: 'BS 004',
		name: 'Chavara Industrial Stop',
		landmarkId: 'LAN-004',
		location: 'POINT(76.5375 8.9875)'
	},
	{
		id: 'BS 005',
		name: 'Punnamada Jetty Stop',
		landmarkId: 'LAN-005',
		location: 'POINT(76.3280 9.4780)'
	},
	{
		id: 'BS 006',
		name: 'Kaloor Metro Stop',
		landmarkId: 'LAN-006',
		location: 'POINT(76.2925 10.0025)'
	},
	{
		id: 'BS 007',
		name: 'Edappally Toll Stop',
		landmarkId: 'LAN-007',
		location: 'POINT(76.3125 10.0275)'
	},
	{
		id: 'BS 008',
		name: 'Thrissur Round Stop',
		landmarkId: 'LAN-008',
		location: 'POINT(76.2175 10.5225)'
	},
	{
		id: 'BS 009',
		name: 'Guruvayur Temple Stop',
		landmarkId: 'LAN-009',
		location: 'POINT(76.0475 10.5975)'
	},
	{
		id: 'BS 010',
		name: 'Kozhikode Beach Stop',
		landmarkId: 'LAN-010',
		location: 'POINT(75.7675 11.2525)'
	}
];

//-- Dummy data: List of operators --
export const operators: Operator[] = [
	{
		id: 'OPER-001',
		companyId: 'COMP-001',
		name: 'John Mathew',
		gender: 'Male',
		email: 'john@entebus.com',
		username: 'john',
		password: 'test@123',
		phone: '+91 98765 00001',
		createdAt: 'Jan 18, 2024',
		isActive: true
	},
	{
		id: 'OPER-002',
		companyId: 'COMP-002',
		name: 'Alice Joseph',
		gender: 'Female',
		email: 'alice@entebus.com',
		username: 'alice',
		password: 'test@123',
		phone: '+91 98765 00002',
		createdAt: 'Feb 02, 2024',
		isActive: true
	},
	{
		id: 'OPER-003',
		companyId: 'COMP-001',
		name: 'Rahul Menon',
		gender: 'Male',
		email: 'rahul@entebus.com',
		username: 'rahul',
		password: 'test@123',
		phone: '+91 98765 00003',
		createdAt: 'Feb 10, 2024',
		isActive: true
	},
	{
		id: 'OPER-004',
		companyId: 'COMP-001',
		name: 'Sneha Kumar',
		gender: 'Female',
		email: 'sneha@entebus.com',
		username: 'sneha',
		password: 'test@123',
		phone: '+91 98765 00004',
		createdAt: 'Feb 15, 2024',
		isActive: false
	},
	{
		id: 'OPER-005',
		companyId: 'COMP-001',
		name: 'Arjun Reddy',
		gender: 'Male',
		email: 'arjun@entebus.com',
		username: 'arjun',
		password: 'test@123',
		phone: '+91 98765 00005',
		createdAt: 'Mar 01, 2024',
		isActive: true
	},
	{
		id: 'OPER-006',
		companyId: 'COMP-001',
		name: 'Priya Nair',
		gender: 'Female',
		email: 'priya@entebus.com',
		username: 'priya',
		password: 'test@123',
		phone: '+91 98765 00006',
		createdAt: 'Mar 05, 2024',
		isActive: true
	},
	{
		id: 'OPER-007',
		companyId: 'COMP-001',
		name: 'Vikram Singh',
		gender: 'Male',
		email: 'vikram@entebus.com',
		username: 'vikram',
		password: 'test@123',
		phone: '+91 98765 00007',
		createdAt: 'Mar 12, 2024',
		isActive: false
	},
	{
		id: 'OPER-008',
		companyId: 'COMP-001',
		name: 'Anjali Varma',
		gender: 'Female',
		email: 'anjali@entebus.com',
		username: 'anjali',
		password: 'test@123',
		phone: '+91 98765 00008',
		createdAt: 'Mar 18, 2024',
		isActive: true
	},
	{
		id: 'OPER-009',
		companyId: 'COMP-001',
		name: 'Kiran Das',
		gender: 'Male',
		email: 'kiran@entebus.com',
		username: 'kiran',
		password: 'test@123',
		phone: '+91 98765 00009',
		createdAt: 'Apr 01, 2024',
		isActive: true
	},
	{
		id: 'OPER-010',
		companyId: 'COMP-001',
		name: 'Meera Thomas',
		gender: 'Female',
		email: 'meera@entebus.com',
		username: 'meera',
		password: 'test@123',
		phone: '+91 98765 00010',
		createdAt: 'Apr 05, 2024',
		isActive: false
	},
	{
		id: 'OPER-011',
		companyId: 'COMP-001',
		name: 'Sanjay Pillai',
		gender: 'Male',
		email: 'sanjay@entebus.com',
		username: 'sanjay',
		password: 'test@123',
		phone: '+91 98765 00011',
		createdAt: 'Apr 10, 2024',
		isActive: true
	},
	{
		id: 'OPER-012',
		companyId: 'COMP-001',
		name: 'Divya Krishnan',
		gender: 'Female',
		email: 'divya@entebus.com',
		username: 'divya',
		password: 'test@123',
		phone: '+91 98765 00012',
		createdAt: 'Apr 15, 2024',
		isActive: true
	},
	{
		id: 'OPER-013',
		companyId: 'COMP-001',
		name: 'Manoj Kumar',
		gender: 'Male',
		email: 'manoj@entebus.com',
		username: 'manoj',
		password: 'test@123',
		phone: '+91 98765 00013',
		createdAt: 'Apr 20, 2024',
		isActive: false
	},
	{
		id: 'OPER-014',
		companyId: 'COMP-001',
		name: 'Neha Sharma',
		gender: 'Female',
		email: 'neha@entebus.com',
		username: 'neha',
		password: 'test@123',
		phone: '+91 98765 00014',
		createdAt: 'May 01, 2024',
		isActive: true
	},
	{
		id: 'OPER-015',
		companyId: 'COMP-001',
		name: 'Amit Roy',
		gender: 'Male',
		email: 'amit@entebus.com',
		username: 'amit',
		password: 'test@123',
		phone: '+91 98765 00015',
		createdAt: 'May 05, 2024',
		isActive: true
	},
	{
		id: 'OPER-016',
		companyId: 'COMP-001',
		name: 'Riya Sen',
		gender: 'Female',
		email: 'riya@entebus.com',
		username: 'riya',
		password: 'test@123',
		phone: '+91 98765 00016',
		createdAt: 'May 10, 2024',
		isActive: true
	},
	{
		id: 'OPER-017',
		companyId: 'COMP-001',
		name: 'Deepak Nambiar',
		gender: 'Male',
		email: 'deepak@entebus.com',
		username: 'deepak',
		password: 'test@123',
		phone: '+91 98765 00017',
		createdAt: 'May 15, 2024',
		isActive: false
	},
	{
		id: 'OPER-018',
		companyId: 'COMP-001',
		name: 'Lakshmi Iyer',
		gender: 'Female',
		email: 'lakshmi@entebus.com',
		username: 'lakshmi',
		password: 'test@123',
		phone: '+91 98765 00018',
		createdAt: 'May 20, 2024',
		isActive: true
	},
	{
		id: 'OPER-019',
		companyId: 'COMP-001',
		name: 'Rohit Babu',
		gender: 'Male',
		email: 'rohit@entebus.com',
		username: 'rohit',
		password: 'test@123',
		phone: '+91 98765 00019',
		createdAt: 'May 25, 2024',
		isActive: true
	},
	{
		id: 'OPER-020',
		companyId: 'COMP-001',
		name: 'Pooja Menon',
		gender: 'Female',
		email: 'pooja@entebus.com',
		username: 'pooja',
		password: 'test@123',
		phone: '+91 98765 00020',
		createdAt: 'Jun 01, 2024',
		isActive: true
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
