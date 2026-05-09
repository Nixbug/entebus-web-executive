//-- Template-first deep merge for schema-based objects. --
//-- `undefined` means "absent → use template". --
//-- `null` is treated as a valid explicit value. --
export function deepMerge(template: any, target: any): any {
	if (Array.isArray(template)) {
		return target !== undefined ? target : structuredClone(template);
	}
	if (typeof template !== 'object' || template === null) {
		return target !== undefined ? target : template;
	}
	const result: any = {};
	for (const key of Object.keys(template)) {
		result[key] = deepMerge(template[key], target?.[key]);
	}
	return result;
}

//-- Deep clone for JSON-compatible permission data. --
export function deepClone<T>(v: T): T {
	return typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v));
}

type AnyObj = Record<string, any>;

//-- helper to get node reference at path --
function getNodeRef(root: AnyObj, path: string[]): AnyObj | undefined {
	let cur: any = root;
	for (const key of path) {
		if (!cur || typeof cur !== 'object' || !(key in cur)) return undefined;
		cur = cur[key];
	}
	return cur;
}

//-- toggle single action at path, returns NEW root --
export function toggleActionClone(root: AnyObj, path: string[], action: string): AnyObj {
	const r = deepClone(root);
	const node = getNodeRef(r, path);
	if (!node) return r;
	if (typeof node[action] === 'boolean') node[action] = !node[action];
	return r;
}

//-- recursively set all boolean flags in an object subtree to val --
function setAllRecursive(obj: AnyObj, val: boolean) {
	for (const k of Object.keys(obj)) {
		if (typeof obj[k] === 'boolean') obj[k] = val;
		else if (obj[k] && typeof obj[k] === 'object') setAllRecursive(obj[k], val);
	}
}

//-- toggle all actions (and cascade to children). returns NEW root --
export function toggleAllClone(root: AnyObj, path: string[]): AnyObj {
	const r = deepClone(root);
	const node = getNodeRef(r, path);
	if (!node) return r;

	//-- determine action keys (own booleans) --
	const actionKeys = Object.keys(node).filter((k) => typeof node[k] === 'boolean');
	const allOn = actionKeys.length > 0 && actionKeys.every((k) => node[k] === true);

	//-- toggle own booleans --
	for (const k of actionKeys) node[k] = !allOn;

	//-- cascade to children (set booleans in children subtree to same value) --
	for (const k of Object.keys(node)) {
		if (node[k] && typeof node[k] === 'object' && !actionKeys.includes(k)) {
			setAllRecursive(node[k], !allOn);
		}
	}

	return r;
}

//-- count enabled/total booleans in a subtree --
export function countPermissions(node: AnyObj | undefined): { enabled: number; total: number } {
	let enabled = 0;
	let total = 0;
	function walk(n: any) {
		if (!n || typeof n !== 'object') return;
		for (const k of Object.keys(n)) {
			const v = n[k];
			if (typeof v === 'boolean') {
				total++;
				if (v) enabled++;
			} else if (typeof v === 'object') {
				walk(v);
			}
		}
	}
	walk(node);
	return { enabled, total };
}

//-- helper to read node state no-clone (works on any root snapshot) --
export function getNodeState(root: AnyObj, path: string[]): AnyObj | undefined {
	return getNodeRef(root, path);
}
