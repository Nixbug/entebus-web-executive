
// Import type from a generic location or expect it as a parameter
export interface PermissionNodeData {
  id: string;
  label?: string;
  actions: string[];
  children?: PermissionNodeData[];
}


/**
 * Builds the initial permission state object from a permission tree.
 *
 * - Each node ID becomes a key in the resulting object.
 * - All actions are initialized with a default value of `false`.
 * - Child permissions are recursively built and flattened into the same object level.
 */
export function buildState(tree: PermissionNodeData[]): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const node of tree) {
    obj[node.id] = {};
    //-- add actions with default false value --
    for (const a of node.actions ?? []) {
      obj[node.id][a] = false;
    }
    //-- add nested children (flatten into same object level) --
    if (node.children?.length) {
      const childrenState = buildState(node.children);
      Object.assign(obj[node.id], childrenState);
    }
  }
  return obj;
}
