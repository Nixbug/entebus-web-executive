// src/lib/services/auth.ts
import { TokenApi } from '$lib/api/apis/TokenApi';
import { Configuration } from '$lib/api/runtime';
import { API_BASE_URL } from '$lib/config';

const config = new Configuration({ basePath: API_BASE_URL });
const tokenApi = new TokenApi(config);

export const login = async (username: string, password: string) => {
    return await tokenApi.createTokenEntebusAccountTokenPost({
        username,
        password,
    });
};

