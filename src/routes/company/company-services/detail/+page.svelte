<script>
import { fetchServiceDetail } from '$lib/services/company-services';


async function loadServiceDetail(id) {
    try {
        const data = await fetchServiceDetail(id);
        console.log('Service detail:', data);
        //store landmark id as list
        const landmarkIds = data.route.landmark_id.map(landmark => landmark.id);
        console.log('Landmark IDs:', landmarkIds);
    } catch (err) {
        console.error('Failed to load service detail:', err);
    }
}
</script>

<button on:click={() => loadServiceDetail(1)}>Load Service Detail</button>