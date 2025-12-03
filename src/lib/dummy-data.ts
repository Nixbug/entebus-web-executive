import type { Executive, ExecutiveRole } from './type';


export const executives: Executive[] = [
    {
        id: 'EXE-001',
        initials: 'EA',
        name: 'Entebus Admin',
        designation: 'System Administrator',
        gender: 'Male',
        isYou: true,
        email: 'admin@entebus.com',
        phone: '+91 98765 00001',
        createdAt: 'Jan 15, 2024',
        isActive: true
    },
    {
        id: 'EXE-002',
        initials: 'JM',
        name: 'John Mathew',
        designation: 'Executive Manager',
        gender: 'Male',
        email: 'john@entebus.com',
        phone: '+91 98765 00002',
        createdAt: 'Jan 18, 2024',
        isActive: true
    },
    {
        id: 'EXE-003',
        initials: 'SW',
        name: 'Sarah Williams',
        designation: 'Operations Head',
        gender: 'Female',
        email: 'sarah@entebus.com',
        phone: '+91 98765 00003',
        createdAt: 'Jan 20, 2024',
        isActive: true
    },
    {
        id: 'EXE-004',
        initials: 'RK',
        name: 'Rajesh Kumar',
        designation: 'Regional Manager',
        gender: 'Male',
        email: 'rajesh@entebus.com',
        phone: '+91 98765 00004',
        createdAt: 'Jan 22, 2024'
    },
    {
        id: 'EXE-005',
        initials: 'PS',
        name: 'Priya Sharma',
        designation: 'Fleet Manager',
        gender: 'Female',
        email: 'priya@entebus.com',
        phone: '+91 98765 00005',
        createdAt: 'Feb 01, 2024'
    },
    {
        id: 'EXE-006',
        initials: 'AK',
        name: 'Amit Kapoor',
        designation: 'HR Director',
        gender: 'Male',
        email: 'amit@entebus.com',
        phone: '+91 98765 00006',
        createdAt: 'Feb 05, 2024'
    },
    {
        id: 'EXE-007',
        initials: 'NS',
        name: 'Neha Singh',
        designation: 'Finance Controller',
        gender: 'Female',
        email: 'neha@entebus.com',
        phone: '+91 98765 00007',
        createdAt: 'Feb 10, 2024',
        isActive: true
    },
    {
        id: 'EXE-008',
        initials: 'VD',
        name: 'Vikram Desai',
        designation: 'IT Lead',
        gender: 'Male',
        email: 'vikram@entebus.com',
        phone: '+91 98765 00008',
        createdAt: 'Feb 15, 2024'
    },
    {
        id: 'EXE-009',
        initials: 'RP',
        name: 'Riya Patel',
        designation: 'Marketing Head',
        gender: 'Female',
        email: 'riya@entebus.com',
        phone: '+91 98765 00009',
        createdAt: 'Feb 20, 2024',
        isActive: true
    },
    {
        id: 'EXE-010',
        initials: 'SG',
        name: 'Sanjay Gupta',
        designation: 'Logistics Supervisor',
        gender: 'Male',
        email: 'sanjay@entebus.com',
        phone: '+91 98765 00010',
        createdAt: 'Mar 01, 2024'
    },
    {
        id: 'EXE-011',
        initials: 'TP',
        name: 'Tanya Prakash',
        designation: 'Customer Support Lead',
        gender: 'Female',
        email: 'tanya@entebus.com',
        phone: '+91 98765 00011',
        createdAt: 'Mar 05, 2024'
    },
    {
        id: 'EXE-012',
        initials: 'AR',
        name: 'Arjun Rao',
        designation: 'Safety Officer',
        gender: 'Male',
        email: 'arjun@entebus.com',
        phone: '+91 98765 00012',
        createdAt: 'Mar 10, 2024'
    },
    {
        id: 'EXE-013',
        initials: 'MG',
        name: 'Meera Ghosh',
        designation: 'Training Coordinator',
        gender: 'Female',
        email: 'meera@entebus.com',
        phone: '+91 98765 00013',
        createdAt: 'Mar 15, 2024'
    },
    {
        id: 'EXE-014',
        initials: 'KB',
        name: 'Karan Bhatia',
        designation: 'Procurement Manager',
        gender: 'Male',
        email: 'karan@entebus.com',
        phone: '+91 98765 00014',
        createdAt: 'Apr 01, 2024'
    },
    {
        id: 'EXE-015',
        initials: 'LJ',
        name: 'Lakshmi Jain',
        designation: 'Compliance Officer',
        gender: 'Female',
        email: 'lakshmi@entebus.com',
        phone: '+91 98765 00015',
        createdAt: 'Apr 05, 2024'
    },
    {
        id: 'EXE-016',
        initials: 'RM',
        name: 'Rohan Malhotra',
        designation: 'Data Analyst',
        gender: 'Male',
        email: 'rohan@entebus.com',
        phone: '+91 98765 00016',
        createdAt: 'Apr 10, 2024'
    },
    {
        id: 'EXE-017',
        initials: 'DV',
        name: 'Divya Verma',
        designation: 'Public Relations Manager',
        gender: 'Female',
        email: 'divya@entebus.com',
        phone: '+91 98765 00017',
        createdAt: 'Apr 15, 2024'
    },
    {
        id: 'EXE-018',
        initials: 'NP',
        name: 'Nikhil Pandey',
        designation: 'Maintenance Head',
        gender: 'Male',
        email: 'nikhil@entebus.com',
        phone: '+91 98765 00018',
        createdAt: 'May 01, 2024'
    },
    {
        id: 'EXE-019',
        initials: 'AS',
        name: 'Ananya Sen',
        designation: 'Sustainability Lead',
        gender: 'Female',
        email: 'ananya@entebus.com',
        phone: '+91 98765 00019',
        createdAt: 'May 05, 2024'
    },
    {
        id: 'EXE-020',
        initials: 'SK',
        name: 'Sameer Khan',
        designation: 'Route Planner',
        gender: 'Male',
        email: 'sameer@entebus.com',
        phone: '+91 98765 00020',
        createdAt: 'May 10, 2024'
    }
];


export const executiveRoles: ExecutiveRole[] = [
    { id: 'ROLE-001', name: 'System Administrator', createdAt: 'Jan 02, 2024', updatedAt: 'Jan 05, 2024' },
    { id: 'ROLE-002', name: 'Guest Role', createdAt: 'Jan 03, 2024', updatedAt: 'Jan 04, 2024' },
    { id: 'ROLE-003', name: 'Executive Manager', createdAt: 'Jan 06, 2024', updatedAt: 'Jan 06, 2024' },
    { id: 'ROLE-004', name: 'Operations Lead', createdAt: 'Jan 07, 2024', updatedAt: 'Jan 09, 2024' },
    { id: 'ROLE-005', name: 'HR Supervisor', createdAt: 'Jan 08, 2024', updatedAt: 'Jan 11, 2024' },
    { id: 'ROLE-006', name: 'Finance Controller', createdAt: 'Jan 10, 2024', updatedAt: 'Jan 12, 2024' },
    { id: 'ROLE-007', name: 'Support Specialist', createdAt: 'Jan 11, 2024', updatedAt: 'Jan 14, 2024' },
    { id: 'ROLE-008', name: 'Project Coordinator', createdAt: 'Jan 12, 2024', updatedAt: 'Jan 13, 2024' },
    { id: 'ROLE-009', name: 'Technical Lead', createdAt: 'Jan 14, 2024', updatedAt: 'Jan 16, 2024' },
    { id: 'ROLE-010', name: 'QA Analyst', createdAt: 'Jan 15, 2024', updatedAt: 'Jan 17, 2024' },
    { id: 'ROLE-011', name: 'Deployment Manager', createdAt: 'Jan 16, 2024', updatedAt: 'Jan 18, 2024' },
    { id: 'ROLE-012', name: 'Data Entry Executive', createdAt: 'Jan 17, 2024', updatedAt: 'Jan 19, 2024' },
    { id: 'ROLE-013', name: 'Vendor Manager', createdAt: 'Jan 19, 2024', updatedAt: 'Jan 20, 2024' },
    { id: 'ROLE-014', name: 'Logistics Coordinator', createdAt: 'Jan 20, 2024', updatedAt: 'Jan 22, 2024' },
    { id: 'ROLE-015', name: 'Marketing Analyst', createdAt: 'Jan 21, 2024', updatedAt: 'Jan 23, 2024' },
    { id: 'ROLE-016', name: 'Content Reviewer', createdAt: 'Jan 23, 2024', updatedAt: 'Jan 25, 2024' },
    { id: 'ROLE-017', name: 'Field Inspector', createdAt: 'Jan 24, 2024', updatedAt: 'Jan 26, 2024' },
    { id: 'ROLE-018', name: 'Security Officer', createdAt: 'Jan 26, 2024', updatedAt: 'Jan 28, 2024' },
    { id: 'ROLE-019', name: 'Shift Supervisor', createdAt: 'Jan 27, 2024', updatedAt: 'Jan 29, 2024' },
    { id: 'ROLE-020', name: 'Junior Assistant', createdAt: 'Jan 28, 2024', updatedAt: 'Jan 30, 2024' }
];


