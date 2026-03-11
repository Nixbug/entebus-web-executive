//-- sesssion storage --//
export class Store {
	//-- store any stringifiable object in session storage under the given key --
	static storeData<T>(key: string, objAsStr: string) {
		sessionStorage.setItem(key, objAsStr);
	}

	//-- get any stringifiable object from session storage under the given key --
	static fetchData<T>(key: string) {
		let objectAsString = sessionStorage.getItem(key);
		if (objectAsString) {
			return JSON.parse(objectAsString) as T;
		}
		return {} as T;
	}
	//-- clear any stored data under the given key --
	static clearData(key: string) {
		sessionStorage.removeItem(key);
	}
}
