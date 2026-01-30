import type { Executive, ExecutiveRole, Company, Landmark, BusStop } from './types/type';

//-- Dummy data: List of executives --
export const executives: Executive[] = [
    {
        id: 'EXE-001',
        initials: 'EA',
        name: 'Entebus Admin',
        designation: 'System Administrator',
        gender: 'Male',
        isYou: true,
        email: 'admin@entebus.com',
        username: 'admin',
        password: 'test@123',
        phone: '+91 98765 00001',
        createdAt: 'Jan 15, 2024',
        isActive: true,
    },
    {
        id: 'EXE-002',
        initials: 'JM',
        name: 'John Mathew',
        designation: 'Executive Manager',
        gender: 'Male',
        email: 'john@entebus.com',
        username: 'john',
        password: 'test@123',
        phone: '+91 98765 00002',
        createdAt: 'Jan 18, 2024',
        isActive: true,
    },
    {
        id: 'EXE-003',
        initials: 'SW',
        name: 'Sarah Williams',
        designation: 'Operations Head',
        gender: 'Female',
        email: 'sarah@entebus.com',
        username: 'sarah',
        password: 'test@123',
        phone: '+91 98765 00003',
        createdAt: 'Jan 20, 2024',
        isActive: true,
    },
    {
        id: 'EXE-004',
        initials: 'RK',
        name: 'Rajesh Kumar',
        designation: 'Regional Manager',
        gender: 'Male',
        email: 'rajesh@entebus.com',
        username: 'rajesh',
        password: 'test@123',
        phone: '+91 98765 00004',
        createdAt: 'Jan 22, 2024',
        isActive: false,
    },
    {
        id: 'EXE-005',
        initials: 'PS',
        name: 'Priya Sharma',
        designation: 'Fleet Manager',
        gender: 'Female',
        email: 'priya@entebus.com',
        username: 'priya',
        password: 'test@123',
        phone: '+91 98765 00005',
        createdAt: 'Feb 01, 2024',
        isActive: false,
    },
    {
        id: 'EXE-006',
        initials: 'AK',
        name: 'Amit Kapoor',
        designation: 'HR Director',
        gender: 'Male',
        email: 'amit@entebus.com',
        username: 'amit',
        password: 'test@123',
        phone: '+91 98765 00006',
        createdAt: 'Feb 05, 2024',
        isActive: false,
    },
    {
        id: 'EXE-007',
        initials: 'NS',
        name: 'Neha Singh',
        designation: 'Finance Controller',
        gender: 'Female',
        email: 'neha@entebus.com',
        username: 'neha',
        password: 'test@123',
        phone: '+91 98765 00007',
        createdAt: 'Feb 10, 2024',
        isActive: true,
    },
    {
        id: 'EXE-008',
        initials: 'VD',
        name: 'Vikram Desai',
        designation: 'IT Lead',
        gender: 'Male',
        email: 'vikram@entebus.com',
        username: 'vikram',
        password: 'test@123',
        phone: '+91 98765 00008',
        createdAt: 'Feb 15, 2024',
        isActive: false,
    },
    {
        id: 'EXE-009',
        initials: 'RP',
        name: 'Riya Patel',
        designation: 'Marketing Head',
        gender: 'Female',
        email: 'riya@entebus.com',
        username: 'riya',
        password: 'test@123',
        phone: '+91 98765 00009',
        createdAt: 'Feb 20, 2024',
        isActive: true,
    },
    {
        id: 'EXE-010',
        initials: 'SG',
        name: 'Sanjay Gupta',
        designation: 'Logistics Supervisor',
        gender: 'Male',
        email: 'sanjay@entebus.com',
        username: 'sanjay',
        password: 'test@123',
        phone: '+91 98765 00010',
        createdAt: 'Mar 01, 2024',
        isActive: false,
    },
    {
        id: 'EXE-011',
        initials: 'TP',
        name: 'Tanya Prakash',
        designation: 'Customer Support Lead',
        gender: 'Female',
        email: 'tanya@entebus.com',
        username: 'tanya',
        password: 'test@123',
        phone: '+91 98765 00011',
        createdAt: 'Mar 05, 2024',
        isActive: false,
    },
    {
        id: 'EXE-012',
        initials: 'AR',
        name: 'Arjun Rao',
        designation: 'Safety Officer',
        gender: 'Male',
        email: 'arjun@entebus.com',
        username: 'arjun',
        password: 'test@123',
        phone: '+91 98765 00012',
        createdAt: 'Mar 10, 2024',
        isActive: false,
    },
    {
        id: 'EXE-013',
        initials: 'MG',
        name: 'Meera Ghosh',
        designation: 'Training Coordinator',
        gender: 'Female',
        email: 'meera@entebus.com',
        username: 'meera',
        password: 'test@123',
        phone: '+91 98765 00013',
        createdAt: 'Mar 15, 2024',
        isActive: false,
    },
    {
        id: 'EXE-014',
        initials: 'KB',
        name: 'Karan Bhatia',
        designation: 'Procurement Manager',
        gender: 'Male',
        email: 'karan@entebus.com',
        username: 'karan',
        password: 'test@123',
        phone: '+91 98765 00014',
        createdAt: 'Apr 01, 2024',
        isActive: false,
    },
    {
        id: 'EXE-015',
        initials: 'LJ',
        name: 'Lakshmi Jain',
        designation: 'Compliance Officer',
        gender: 'Female',
        email: 'lakshmi@entebus.com',
        username: 'lakshmi',
        password: 'test@123',
        phone: '+91 98765 00015',
        createdAt: 'Apr 05, 2024',
        isActive: false,
    },
    {
        id: 'EXE-016',
        initials: 'RM',
        name: 'Rohan Malhotra',
        designation: 'Data Analyst',
        gender: 'Male',
        email: 'rohan@entebus.com',
        username: 'rohan',
        password: 'test@123',
        phone: '+91 98765 00016',
        createdAt: 'Apr 10, 2024',
        isActive: false,
    },
    {
        id: 'EXE-017',
        initials: 'DV',
        name: 'Divya Verma',
        designation: 'Public Relations Manager',
        gender: 'Female',
        email: 'divya@entebus.com',
        username: 'divya',
        password: 'test@123',
        phone: '+91 98765 00017',
        createdAt: 'Apr 15, 2024',
        isActive: false,
    },
    {
        id: 'EXE-018',
        initials: 'NP',
        name: 'Nikhil Pandey',
        designation: 'Maintenance Head',
        gender: 'Male',
        email: 'nikhil@entebus.com',
        username: 'nikhil',
        password: 'test@123',
        phone: '+91 98765 00018',
        createdAt: 'May 01, 2024',
        isActive: false,
    },
    {
        id: 'EXE-019',
        initials: 'AS',
        name: 'Ananya Sen',
        designation: 'Sustainability Lead',
        gender: 'Female',
        email: 'ananya@entebus.com',
        username: 'ananya',
        password: 'test@123',
        phone: '+91 98765 00019',
        createdAt: 'May 05, 2024',
        isActive: false,
    },
    {
        id: 'EXE-020',
        initials: 'SK',
        name: 'Sameer Khan',
        designation: 'Route Planner',
        gender: 'Male',
        email: 'sameer@entebus.com',
        username: 'sameer',
        password: 'test@123',
        phone: '+91 98765 00020',
        createdAt: 'May 10, 2024',
        isActive: false,
    },
];

function generateRandomPermissionFlag(): boolean {
    return Math.random() > 0.5;
}
function generateCrudPermissions() {
    return {
        create: generateRandomPermissionFlag(),
        update: generateRandomPermissionFlag(),
        delete: generateRandomPermissionFlag(),
        fetch: generateRandomPermissionFlag(),
    };
}

function generatePermissions() {
    return {
        landmark: {
            ...generateCrudPermissions(),
            bus_stop: {
                ...generateCrudPermissions(),
            },
        },

        fare: {
            ...generateCrudPermissions(),
        },

        executive: {
            ...generateCrudPermissions(),
            role: {
                ...generateCrudPermissions(),
            },
            token: {
                ...generateCrudPermissions(),
            },
        },

        business: {
            ...generateCrudPermissions(),
            vendor: {
                ...generateCrudPermissions(),
                role: {
                    ...generateCrudPermissions(),
                },
                token: {
                    ...generateCrudPermissions(),
                },
            },
        },

        company: {
            ...generateCrudPermissions(),
            bus: {
                ...generateCrudPermissions(),
            },
            fare: {
                ...generateCrudPermissions(),
            },
            route: {
                ...generateCrudPermissions(),
            },
            operator: {
                ...generateCrudPermissions(),
                role: {
                    ...generateCrudPermissions(),
                },
                token: {
                    ...generateCrudPermissions(),
                },
            },
            service: {
                ...generateCrudPermissions(),
                duty: {
                    ...generateCrudPermissions(),
                },
            },
        },
    };
}

export const executiveRoles: ExecutiveRole[] = [
    {
        id: 'ROLE-001',
        name: 'System Administrator',
        permissions: generatePermissions(),
        createdAt: 'Jan 02, 2024',
        updatedAt: 'Jan 05, 2024',
    },
    {
        id: 'ROLE-002',
        name: 'Guest Role',
        permissions: generatePermissions(),
        createdAt: 'Jan 03, 2024',
        updatedAt: 'Jan 04, 2024',
    },
    {
        id: 'ROLE-003',
        name: 'Executive Manager',
        permissions: generatePermissions(),
        createdAt: 'Jan 06, 2024',
        updatedAt: 'Jan 06, 2024',
    },
    {
        id: 'ROLE-004',
        name: 'Operations Lead',
        permissions: generatePermissions(),
        createdAt: 'Jan 07, 2024',
        updatedAt: 'Jan 09, 2024',
    },
    {
        id: 'ROLE-005',
        name: 'HR Supervisor',
        permissions: generatePermissions(),
        createdAt: 'Jan 08, 2024',
        updatedAt: 'Jan 11, 2024',
    },
    {
        id: 'ROLE-006',
        name: 'Finance Controller',
        permissions: generatePermissions(),
        createdAt: 'Jan 10, 2024',
        updatedAt: 'Jan 12, 2024',
    },
    {
        id: 'ROLE-007',
        name: 'Support Specialist',
        permissions: generatePermissions(),
        createdAt: 'Jan 11, 2024',
        updatedAt: 'Jan 14, 2024',
    },
    {
        id: 'ROLE-008',
        name: 'Project Coordinator',
        permissions: generatePermissions(),
        createdAt: 'Jan 12, 2024',
        updatedAt: 'Jan 13, 2024',
    },
    {
        id: 'ROLE-009',
        name: 'Technical Lead',
        permissions: generatePermissions(),
        createdAt: 'Jan 14, 2024',
        updatedAt: 'Jan 16, 2024',
    },
    {
        id: 'ROLE-010',
        name: 'QA Analyst',
        permissions: generatePermissions(),
        createdAt: 'Jan 15, 2024',
        updatedAt: 'Jan 17, 2024',
    },
    {
        id: 'ROLE-011',
        name: 'Deployment Manager',
        permissions: generatePermissions(),
        createdAt: 'Jan 16, 2024',
        updatedAt: 'Jan 18, 2024',
    },
    {
        id: 'ROLE-012',
        name: 'Data Entry Executive',
        permissions: generatePermissions(),
        createdAt: 'Jan 17, 2024',
        updatedAt: 'Jan 19, 2024',
    },
    {
        id: 'ROLE-013',
        name: 'Vendor Manager',
        permissions: generatePermissions(),
        createdAt: 'Jan 19, 2024',
        updatedAt: 'Jan 20, 2024',
    },
    {
        id: 'ROLE-014',
        name: 'Logistics Coordinator',
        permissions: generatePermissions(),
        createdAt: 'Jan 20, 2024',
        updatedAt: 'Jan 22, 2024',
    },
    {
        id: 'ROLE-015',
        name: 'Marketing Analyst',
        permissions: generatePermissions(),
        createdAt: 'Jan 21, 2024',
        updatedAt: 'Jan 23, 2024',
    },
    {
        id: 'ROLE-016',
        name: 'Content Reviewer',
        permissions: generatePermissions(),
        createdAt: 'Jan 23, 2024',
        updatedAt: 'Jan 25, 2024',
    },
    {
        id: 'ROLE-017',
        name: 'Field Inspector',
        permissions: generatePermissions(),
        createdAt: 'Jan 24, 2024',
        updatedAt: 'Jan 26, 2024',
    },
    {
        id: 'ROLE-018',
        name: 'Security Officer',
        permissions: generatePermissions(),
        createdAt: 'Jan 26, 2024',
        updatedAt: 'Jan 28, 2024',
    },
    {
        id: 'ROLE-019',
        name: 'Shift Supervisor',
        permissions: generatePermissions(),
        createdAt: 'Jan 27, 2024',
        updatedAt: 'Jan 29, 2024',
    },
    {
        id: 'ROLE-020',
        name: 'Junior Assistant',
        permissions: generatePermissions(),
        createdAt: 'Jan 28, 2024',
        updatedAt: 'Jan 30, 2024',
    },
];
//-- Dummy data: List of companies --
export const companies: Company[] = [
    {
        id: "COMP-001",
        name: "Tata Consultancy",
        ownerName: "Ratan Tata",
        location: "Mumbai",
        address: "TCS House, Raveline St, Fort, Mumbai, Maharashtra",
        email: "contact@tcs.com",
        phone: "+91-22-6778-1234",
        status: "Verified",
        type: "Public",
        createdAt: "2025-10-26 06:52:16",
        updatedAt: "2026-04-13 06:52:16"
    },
    {
        id: "COMP-002",
        name: "Infosys Ltd",
        ownerName: "N. R. Narayana Murthy",
        location: "Bengaluru",
        address: "Electronics City, Hosur Road, Bengaluru, Karnataka",
        email: "info@infosys.com",
        phone: "+91-80-2852-1234",
        status: "Verified",
        type: "Public",
        createdAt: "2025-10-21 22:27:57",
        updatedAt: "2026-03-08 22:27:57"
    },
    {
        id: "COMP-003",
        name: "Wipro Ltd",
        ownerName: "Azim Premji",
        location: "Bengaluru",
        address: "Sarjapur Road, Bengaluru, Karnataka",
        email: "support@wipro.com",
        phone: "+91-80-2844-5678",
        status: "Suspended",
        type: "Public",
        createdAt: "2025-10-15 06:02:38",
        updatedAt: "2026-02-01 06:02:38"
    },
    {
        id: "COMP-004",
        name: "HCL Technologies",
        ownerName: "Shiv Nadar",
        location: "Noida",
        address: "HCL Towers, Sector 16, Noida, Uttar Pradesh",
        email: "contact@hcl.com",
        phone: "+91-120-123-4567",
        status: "Verified",
        type: "Public",
        createdAt: "2024-12-11 20:34:39",
        updatedAt: "2024-12-31 20:34:39"
    },
    {
        id: "COMP-005",
        name: "Larsen & Toubro Infotech",
        ownerName: "S. N. Subrahmanyan",
        location: "Mumbai",
        address: "L&T House, Ballard Estate, Mumbai, Maharashtra",
        email: "hello@lntinfotech.com",
        phone: "+91-22-2345-6789",
        status: "Validating",
        type: "Private",
        createdAt: "2024-12-28 18:03:36",
        updatedAt: "2025-02-24 18:03:36"
    },
    {
        id: "COMP-006",
        name: "Tech Mahindra",
        ownerName: "CP Gurnani",
        location: "Pune",
        address: "Magarpatta City, Pune, Maharashtra",
        email: "contact@techmahindra.com",
        phone: "+91-20-4010-1234",
        status: "Verified",
        type: "Private",
        createdAt: "2024-12-20 11:37:02",
        updatedAt: "2025-05-18 11:37:02"
    },
    {
        id: "COMP-007",
        name: "Mindtree Ltd",
        ownerName: "Krishnakumar N.",
        location: "Bengaluru",
        address: "Global Village, Whitefield, Bengaluru, Karnataka",
        email: "support@mindtree.com",
        phone: "+91-80-6700-5678",
        status: "Validating",
        type: "Private",
        createdAt: "2025-09-06 19:17:59",
        updatedAt: "2025-11-21 19:17:59"
    },
    {
        id: "COMP-008",
        name: "Reliance Industries Ltd",
        ownerName: "Mukesh Ambani",
        location: "Mumbai",
        address: "Reliance Corporate Park, Santacruz, Mumbai, Maharashtra",
        email: "info@ril.com",
        phone: "+91-22-3303-5678",
        status: "Verified",
        type: "Public",
        createdAt: "2025-01-22 23:05:10",
        updatedAt: "2025-05-02 23:05:10"
    },
    {
        id: "COMP-009",
        name: "Bharti Airtel",
        ownerName: "Sunil Bharti Mittal",
        location: "Gurugram",
        address: "Airtel Center, Sector 21, Gurugram, Haryana",
        email: "contact@airtel.com",
        phone: "+91-124-456-7890",
        status: "Verified",
        type: "Public",
        createdAt: "2025-08-12 05:07:04",
        updatedAt: "2025-10-05 05:07:04"
    },
    {
        id: "COMP-010",
        name: "Axis Bank",
        ownerName: "Amitabh Chaudhry",
        location: "Mumbai",
        address: "Axis House, Worli, Mumbai, Maharashtra",
        email: "support@axisbank.com",
        phone: "+91-22-2425-6789",
        status: "Verified",
        type: "Public",
        createdAt: "2025-03-21 05:31:49",
        updatedAt: "2025-08-24 05:31:49"
    },
    {
        id: "COMP-011",
        name: "ICICI Bank",
        ownerName: "Sandeep Bakhshi",
        location: "Mumbai",
        address: "ICICI Tower, Bandra Kurla Complex, Mumbai, Maharashtra",
        email: "contact@icicibank.com",
        phone: "+91-22-2656-7890",
        status: "Suspended",
        type: "Public",
        createdAt: "2025-01-02 18:41:57",
        updatedAt: "2025-04-11 18:41:57"
    },
    {
        id: "COMP-012",
        name: "HDFC Bank",
        ownerName: "Sashidhar Jagdishan",
        location: "Mumbai",
        address: "HDFC Bank House, Senapati Bapat Marg, Mumbai, Maharashtra",
        email: "info@hdfcbank.com",
        phone: "+91-22-6160-1234",
        status: "Verified",
        type: "Public",
        createdAt: "2025-01-11 18:55:31",
        updatedAt: "2025-01-16 18:55:31"
    },
    {
        id: "COMP-013",
        name: "Maruti Suzuki",
        ownerName: "Kenichi Ayukawa",
        location: "Gurugram",
        address: "Maruti Suzuki HQ, Gurugram, Haryana",
        email: "support@marutisuzuki.com",
        phone: "+91-124-234-5678",
        status: "Validating",
        type: "Private",
        createdAt: "2025-10-04 04:11:56",
        updatedAt: "2025-11-09 04:11:56"
    },
    {
        id: "COMP-014",
        name: "Bajaj Auto",
        ownerName: "Rahul Bajaj",
        location: "Pune",
        address: "Bajaj Auto Ltd, Akurdi, Pune, Maharashtra",
        email: "contact@bajajauto.com",
        phone: "+91-20-3050-1234",
        status: "Suspended",
        type: "Private",
        createdAt: "2025-01-02 14:24:06",
        updatedAt: "2025-04-04 14:24:06"
    },
    {
        id: "COMP-015",
        name: "Adani Enterprises",
        ownerName: "Gautam Adani",
        location: "Ahmedabad",
        address: "Adani House, Ashram Road, Ahmedabad, Gujarat",
        email: "info@adani.com",
        phone: "+91-79-6789-1234",
        status: "Validating",
        type: "Private",
        createdAt: "2025-03-16 23:14:43",
        updatedAt: "2025-04-15 23:14:43"
    },
    {
        id: "COMP-016",
        name: "Vedanta Ltd",
        ownerName: "Anil Agarwal",
        location: "Mumbai",
        address: "Vedanta Corporate Office, Worli, Mumbai, Maharashtra",
        email: "support@vedanta.com",
        phone: "+91-22-4000-5678",
        status: "Verified",
        type: "Public",
        createdAt: "2025-08-22 03:42:10",
        updatedAt: "2025-12-17 03:42:10"
    },
    {
        id: "COMP-017",
        name: "Godrej Industries",
        ownerName: "Adi Godrej",
        location: "Mumbai",
        address: "Godrej One, Pirojshanagar, Vikhroli, Mumbai, Maharashtra",
        email: "contact@godrej.com",
        phone: "+91-22-6789-4321",
        status: "Validating",
        type: "Private",
        createdAt: "2025-01-08 21:16:12",
        updatedAt: "2025-06-27 21:16:12"
    },
    {
        id: "COMP-018",
        name: "Asian Paints",
        ownerName: "V. G. Siddhartha",
        location: "Mumbai",
        address: "Asian Paints Ltd, Santacruz, Mumbai, Maharashtra",
        email: "info@asianpaints.com",
        phone: "+91-22-3050-6789",
        status: "Validating",
        type: "Private",
        createdAt: "2025-11-24 19:38:50",
        updatedAt: "2026-01-29 19:38:50"
    },
    {
        id: "COMP-019",
        name: "ICICI Prudential",
        ownerName: "Sandeep Bakhshi",
        location: "Mumbai",
        address: "ICICI Prudential HQ, Bandra Kurla Complex, Mumbai, Maharashtra",
        email: "support@iciciprulife.com",
        phone: "+91-22-6160-7890",
        status: "Validating",
        type: "Private",
        createdAt: "2025-11-28 23:38:22",
        updatedAt: "2026-04-24 23:38:22"
    },
    {
        id: "COMP-020",
        name: "Hindustan Unilever",
        ownerName: "Sanjiv Mehta",
        location: "Mumbai",
        address: "Unilever House, Andheri East, Mumbai, Maharashtra",
        email: "info@hul.co.in",
        phone: "+91-22-6789-1230",
        status: "Validating",
        type: "Public",
        createdAt: "2025-06-08 05:13:30",
        updatedAt: "2025-10-27 05:13:30"
    }
];

//-- Dummy data: List of companies --
export const landmarks: Landmark[] = [
    {
        id: "LAN 001",
        name: "Palayam Market Area",
        type: "Local",
        boundary: "POLYGON((76.9450 8.5050,76.9580 8.5050,76.9580 8.5180,76.9450 8.5180,76.9450 8.5050))"
    },
    {
        id: "LAN 002",
        name: "Kowdiar Residential Zone",
        type: "Local",
        boundary: "POLYGON((76.9600 8.5250,76.9750 8.5250,76.9750 8.5400,76.9600 8.5400,76.9600 8.5250))"
    },
    {
        id: "LAN 003",
        name: "Kollam Beach Stretch",
        type: "Village",
        boundary: "POLYGON((76.5700 8.8800,76.5850 8.8800,76.5850 8.8950,76.5700 8.8950,76.5700 8.8800))"
    },
    {
        id: "LAN 004",
        name: "Chavara Industrial Pocket",
        type: "District",
        boundary: "POLYGON((76.5300 8.9800,76.5450 8.9800,76.5450 8.9950,76.5300 8.9950,76.5300 8.9800))"
    },
    {
        id: "LAN 005",
        name: "Alappuzha Backwater Belt",
        type: "District",
        boundary: "POLYGON((76.3200 9.4700,76.3360 9.4700,76.3360 9.4860,76.3200 9.4860,76.3200 9.4700))"
    },
    {
        id: "LAN 006",
        name: "Kaloor Junction Area",
        type: "Local",
        boundary: "POLYGON((76.2850 9.9950,76.3000 9.9950,76.3000 10.0100,76.2850 10.0100,76.2850 9.9950))"
    },
    {
        id: "LAN 007",
        name: "Edappally Toll Zone",
        type: "District",
        boundary: "POLYGON((76.3050 10.0200,76.3200 10.0200,76.3200 10.0350,76.3050 10.0350,76.3050 10.0200))"
    },
    {
        id: "LAN 008",
        name: "Thrissur Round Area",
        type: "Local",
        boundary: "POLYGON((76.2100 10.5150,76.2250 10.5150,76.2250 10.5300,76.2100 10.5300,76.2100 10.5150))"
    },
    {
        id: "LAN 009",
        name: "Guruvayur Temple Zone",
        type: "State",
        boundary: "POLYGON((76.0400 10.5900,76.0550 10.5900,76.0550 10.6050,76.0400 10.6050,76.0400 10.5900))"
    },
    {
        id: "LAN 010",
        name: "Kozhikode Beach Road",
        type: "State",
        boundary: "POLYGON((75.7600 11.2450,75.7750 11.2450,75.7750 11.2600,75.7600 11.2600,75.7600 11.2450))"
    }
];

//-- Dummy data: List of global fares --
export const globalFares = [
    {
        "id": "GFARE-001",
        "version": 2,
        "name": "Kerala Stage Fare",
        "attributes": {
            "df_version": 1,
            "ticket_types": [
                {
                    "id": 1,
                    "name": "Adult"
                },
                {
                    "id": 2,
                    "name": "Child"
                },
                {
                    "id": 3,
                    "name": "Handicapped"
                },
            ],
            "currency_type": "INR",
            "distance_unit": "m",
            "extra": {}
        },
        "function": `function getFare(ticket_type, distance, extra) {
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
        "scope": 2,
        "updated_on": "2025-10-25T05:15:00.375387Z",
        "created_on": "2025-10-25T05:14:53.462506Z"
    },
    {
        "id": "GFARE-002",
        "version": 1,
        "name": "Tamil Nadu Stage Fare",
        "attributes": {
            "df_version": 1,
            "ticket_types": [
                {
                    "id": 1,
                    "name": "Adult"
                },
                {
                    "id": 2,
                    "name": "Child"
                },
                {
                    "id": 3,
                    "name": "Student"
                },
            ],
            "currency_type": "USD",
            "distance_unit": "m",
            "extra": {}
        },
        "function": `function getFare(ticket_type, distance, extra) {
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
        "scope": 2,
        "updated_on": "2025-10-25T05:15:00.375387Z",
        "created_on": "2025-10-25T05:14:53.462506Z"
    }
];

//-- Dummy data: List of bus stops --
export const busStops: BusStop[] = [
    {
        id: "BS 001",
        name: "Palayam Bus Stop",
        landmarkId: "LAN 001",
        location: "POINT(76.9515 8.5115)"
    },
    {
        id: "BS 002",
        name: "Palayam Bus Stop 2",
        landmarkId: "LAN 001",
        location: "POINT(76.9530 8.5130)"
    },
    {
        id: "BS 003",
        name: "Kollam Beach Stop",
        landmarkId: "LAN 003",
        location: "POINT(76.5775 8.8875)"
    },
    {
        id: "BS 004",
        name: "Chavara Industrial Stop",
        landmarkId: "LAN 004",
        location: "POINT(76.5375 8.9875)"
    },
    {
        id: "BS 005",
        name: "Punnamada Jetty Stop",
        landmarkId: "LAN 005",
        location: "POINT(76.3280 9.4780)"
    },
    {
        id: "BS 006",
        name: "Kaloor Metro Stop",
        landmarkId: "LAN 006",
        location: "POINT(76.2925 10.0025)"
    },
    {
        id: "BS 007",
        name: "Edappally Toll Stop",
        landmarkId: "LAN 007",
        location: "POINT(76.3125 10.0275)"
    },
    {
        id: "BS 008",
        name: "Thrissur Round Stop",
        landmarkId: "LAN 008",
        location: "POINT(76.2175 10.5225)"
    },
    {
        id: "BS 009",
        name: "Guruvayur Temple Stop",
        landmarkId: "LAN 009",
        location: "POINT(76.0475 10.5975)"
    },
    {
        id: "BS 010",
        name: "Kozhikode Beach Stop",
        landmarkId: "LAN 010",
        location: "POINT(75.7675 11.2525)"
    }
];