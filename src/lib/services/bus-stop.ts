import { apiFetch } from '$lib/services/fetch-client';
import type { operations } from '$lib/api/types';

export type FetchBusStopListResponse =
    operations['fetch_bus_stop_executive_landmark_bus_stop_get']['responses'][200]['content']['application/json'];
