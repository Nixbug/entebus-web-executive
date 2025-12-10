

export interface PermissionNodeData {
    id: string;
    label?: string;
    actions: string[];
    children?: PermissionNodeData[];
}

export const permissionTree: PermissionNodeData[] = [
    {
        id: "landmark",
        label: "Landmark",
        actions: ["create", "update", "delete", "fetch"],
        children: [
            { id: "bus_stop", label: "Bus Stop", actions: ["create", "update", "delete", "fetch"] },
            { id: "terminal", label: "Terminal", actions: ["create", "update", "delete", "fetch"] }
        ]
    },
    {
        id: "fare",
        label: "Fare",
        actions: ["create", "update", "delete", "fetch"]
    },
    {
        id: "executive",
        label: "Executive",
        actions: ["create", "update", "delete"],
        children: [
            { id: "role", label: "Role", actions: ["create", "update", "delete"] },
            { id: "token", label: "Token", actions: ["fetch", "delete"] }
        ]
    },
    {
        id: "business",
        label: "Business",
        actions: ["create", "update", "delete"],
        children: [
            {
                id: "vendor",
                label: "Vendor",
                actions: ["create", "update", "delete"],
                children: [
                    { id: "role", label: "Role", actions: ["create", "update", "delete"] },
                    { id: "token", label: "Token", actions: ["fetch", "delete"] }
                ]
            }
        ]
    },
    {
        id: "company",
        label: "Company",
        actions: ["create", "update", "delete"],
        children: [
            { id: "bus", label: "Bus", actions: ["create", "update", "delete"] },
            { id: "fare", label: "Fare", actions: ["create", "update", "delete"] },
            { id: "route", label: "Route", actions: ["create", "update", "delete"] },
            {
                id: "operator",
                label: "Operator",
                actions: ["create", "update", "delete"],
                children: [
                    { id: "role", label: "Role", actions: ["create", "update", "delete"] },
                    { id: "token", label: "Token", actions: ["fetch", "delete"] }
                ]
            },
            {
                id: "service",
                label: "Service",
                actions: ["create", "update", "delete"],
                children: [{ id: "duty", label: "Duty", actions: ["create", "update", "delete"] }]
            }
        ]
    }
];
