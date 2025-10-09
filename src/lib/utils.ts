export class Utils{
    
    static toURLSearchParams(object: object): URLSearchParams {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(object)) {
			if (value !== null && value !== undefined && value !== '') {
				params.append(key, value);
			}
		}
		return params;
	} 

}