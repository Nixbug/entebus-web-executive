

export class Store {

	static storeData<T>(key: string, objAsStr: string) {
		sessionStorage.setItem(key, objAsStr);
	}

	static fetchData<T>(key: string) {
		const objectAsString = sessionStorage.getItem(key);
		if (objectAsString) {
			return JSON.parse(objectAsString) as T;
		}
		return {} as T;
	}
}


