export class Store {
	static storeData<T>(key: string, objAsStr: string) {
		sessionStorage.setItem(key, objAsStr);
	}
}
