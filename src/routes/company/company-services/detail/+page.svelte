<script>
import { fetchServiceDetail } from '$lib/services/company-services';
import {fetchLandmarkList} from '$lib/services/landmark';

async function loadServiceDetail(id) {
    try {
        const data = await fetchServiceDetail(id);
        console.log('Service detail:', data);
        //store landmark id as list
        const landmarkIds = data.route.map((route) => route.landmark_id);
        console.log('Landmark IDs:', landmarkIds);
        const landmarks = await fetchLandmarkList({ id_list: landmarkIds });
        console.log('Landmarks:', landmarks);
    } catch (err) {
        console.error('Failed to load service detail:', err);
    }
}
</script>

<button on:click={() => loadServiceDetail(1)}>Load Service Detail</button>