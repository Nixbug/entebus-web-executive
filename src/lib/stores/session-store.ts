import { browser } from '$app/environment';

//-- session storage --//
export class Store {
	//-- store any JSON-serializable object in session storage under the given key --
	static storeData<T>(key: string, value: T) {
		if (!browser) return;
		try {
			sessionStorage.setItem(key, JSON.stringify(value));
		} catch (e) {
			// ignore storage errors
		}
	}

	//-- get any stringifiable object from session storage under the given key --
	static fetchData<T>(key: string) {
		if (!browser) return {} as T;
		const objectAsString = sessionStorage.getItem(key);
		if (objectAsString) {
			try {
				return JSON.parse(objectAsString) as T;
			} catch (e) {
				try {
					sessionStorage.removeItem(key);
				} catch {}
				return {} as T;
			}
		}
		return {} as T;
	}
	//-- clear any stored data under the given key --
	static clearData(key: string) {
		if (!browser) return;
		sessionStorage.removeItem(key);
	}
}
