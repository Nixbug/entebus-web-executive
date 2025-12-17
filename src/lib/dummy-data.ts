import type { Executive, ExecutiveRole } from './types/type';


export const executives: Executive[] = [
    {
        id: 'EXE-001',
        initials: 'EA',
        name: 'Entebus Admin',
        designation: 'System Administrator',
        gender: 'Male',
        color: '#E65858',
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
        color: '#7A58E6',
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
        color: '#F27E4B',
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
        color: '#589BE6',
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
        color: '#C158E6',
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
        color: '#4B9E7A',
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
        color: '#E67E22',
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
        color: '#3498DB',
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
        color: '#9B59B6',
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
        color: '#27AE60',
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
        color: '#E74C3C',
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
        color: '#1ABC9C',
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
        color: '#F1C40F',
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
        color: '#34495E',
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
        color: '#8E44AD',
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
        color: '#16A085',
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
        color: '#D35400',
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
        color: '#2980B9',
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
        color: '#27AE60',
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
        color: '#C0392B',
        email: 'sameer@entebus.com',
        phone: '+91 98765 00020',
        createdAt: 'May 10, 2024'
    }
];




function rand(): boolean {
  return Math.random() > 0.5;
}

function generatePermissions() {
  return {
    landmark: {
      create: rand(),
      update: rand(),
      delete: rand(),
      bus_stop: {
        create: rand(),
        update: rand(),
        delete: rand(),
      },
    },
    fare: {
      create: rand(),
      update: rand(),
      delete: rand(),
    },
    executive: {
      create: rand(),
      update: rand(),
      delete: rand(),
      role: {
        create: rand(),
        update: rand(),
        delete: rand(),
      },
      token: {
        fetch: rand(),
        delete: rand(),
      },
    },
    business: {
      create: rand(),
      update: rand(),
      delete: rand(),
      vendor: {
        create: rand(),
        update: rand(),
        delete: rand(),
        role: {
          create: rand(),
          update: rand(),
          delete: rand(),
        },
        token: {
          fetch: rand(),
          delete: rand(),
        },
      },
    },
    company: {
      create: rand(),
      update: rand(),
      delete: rand(),
      bus: {
        create: rand(),
        update: rand(),
        delete: rand(),
      },
      fare: {
        create: rand(),
        update: rand(),
        delete: rand(),
      },
      route: {
        create: rand(),
        update: rand(),
        delete: rand(),
      },
      operator: {
        create: rand(),
        update: rand(),
        delete: rand(),
        role: {
          create: rand(),
          update: rand(),
          delete: rand(),
        },
        token: {
          fetch: rand(),
          delete: rand(),
        },
      },
      service: {
        create: rand(),
        update: rand(),
        delete: rand(),
        duty: {
          create: rand(),
          update: rand(),
          delete: rand(),
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
