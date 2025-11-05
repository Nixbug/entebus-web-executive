import { TokenApi } from '$lib/api/apis/TokenApi';
import { Configuration } from '$lib/api/runtime';
import { API_BASE_URL } from '$lib/services/config';
import { Store } from '$lib/helper'
import { goto } from '$app/navigation';
import type { ExecutiveToken } from '$lib/type';

const config = new Configuration({ basePath: API_BASE_URL });
const tokenApi = new TokenApi(config);

export const login = async (username: string, password: string) => {
    return await tokenApi.createTokenEntebusAccountTokenPost({
        username,
        password,
    });
};

//-- token validation --
export async function validateToken() {
    const tokenString = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!tokenString) return;
    let token: ExecutiveToken;
    try {
        token = JSON.parse(tokenString);
    } catch {
        clearToken();
        return;
    }
    try {
        const api = new TokenApi(
            new Configuration({
                basePath: API_BASE_URL,
                accessToken: () => token.accessToken
            })
        );
        await api.fetchTokenEntebusAccountTokenGet();
        Store.storeData('token', JSON.stringify(token));
        goto('/executive-account', { replaceState: true });
    } catch {
        clearToken(); 
    }
}

//-- clear token --
function clearToken() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    Store.clearData('token');
}
