import type { PermissionNodeData } from "./permission-tree";

/**
 * Build a state object that matches your backend shape:
 * {
 *   landmark: { create: false, update:false, ..., bus_stop: { create:false, ... } },
 *   fare: { create:false, ... },
 *   ...
 * }
 */
export function buildState(tree: PermissionNodeData[]): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const node of tree) {
    obj[node.id] = {};
    // add actions
    for (const a of node.actions ?? []) {
      obj[node.id][a] = false;
    }
    // add nested children (flatten into same object level)
    if (node.children?.length) {
      const childrenState = buildState(node.children);
      Object.assign(obj[node.id], childrenState);
    }
  }
  return obj;
}
