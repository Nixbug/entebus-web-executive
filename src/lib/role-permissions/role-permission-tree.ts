import type { PermissionNodeData } from './build-state';



//---- Defines the hierarchical structure of permissions ----
export const executiveRolePermissionTree: PermissionNodeData[] = [
    {
        id: "landmark",
        label: "Landmark",
        actions: ["fetch", "create", "update", "delete"],
        children: [
            {
                id: "bus_stop",
                label: "Bus Stop",
                actions: ["fetch", "create", "update", "delete"]
            },
            {
                id: "terminal",
                label: "Terminal",
                actions: ["fetch", "create", "update", "delete"]
            }
        ]
    },
    {
        id: "fare",
        label: "Fare",
        actions: ["fetch", "create", "update", "delete"]
    },
    {
        id: "executive",
        label: "Executive",
        actions: ["fetch", "create", "update", "delete"],
        children: [
            {
                id: "role",
                label: "Role",
                actions: ["fetch", "create", "update", "delete"]
            },
            {
                id: "token",
                label: "Token",
                actions: ["fetch", "delete"]
            }
        ]
    },
    {
        id: "business",
        label: "Business",
        actions: ["fetch", "create", "update", "delete"],
        children: [
            {
                id: "vendor",
                label: "Vendor",
                actions: ["fetch", "create", "update", "delete"],
                children: [
                    {
                        id: "role",
                        label: "Role",
                        actions: ["fetch", "create", "update", "delete"]
                    },
                    {
                        id: "token",
                        label: "Token",
                        actions: ["fetch", "delete"]
                    }
                ]
            }
        ]
    },
    {
        id: "company",
        label: "Company",
        actions: ["fetch", "create", "update", "delete"],
        children: [
            {
                id: "bus",
                label: "Bus",
                actions: ["fetch", "create", "update", "delete"]
            },
            {
                id: "fare",
                label: "Fare",
                actions: ["fetch", "create", "update", "delete"]
            },
            {
                id: "route",
                label: "Route",
                actions: ["fetch", "create", "update", "delete"]
            },
            {
                id: "operator",
                label: "Operator",
                actions: ["fetch", "create", "update", "delete"],
                children: [
                    {
                        id: "role",
                        label: "Role",
                        actions: ["fetch", "create", "update", "delete"]
                    },
                    {
                        id: "token",
                        label: "Token",
                        actions: ["fetch", "delete"]
                    }
                ]
            },
            {
                id: "service",
                label: "Service",
                actions: ["fetch", "create", "update", "delete"],
                children: [
                    {
                        id: "duty",
                        label: "Duty",
                        actions: ["fetch", "create", "update", "delete"]
                    }
                ]
            }
        ]
    }
];

