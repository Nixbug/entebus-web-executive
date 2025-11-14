
//-- sesssion storage --//
export class Store {
	static storeData<T>(key: string, objAsStr: string) {
		sessionStorage.setItem(key, objAsStr);
	}

	static fetchData<T>(key: string) {
		let objectAsString = sessionStorage.getItem(key);
		if (objectAsString) {
			return JSON.parse(objectAsString) as T;
		}
		return {} as T;
	}
    static clearData(key: string) {
        sessionStorage.removeItem(key);
    }
}