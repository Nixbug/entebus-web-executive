<script lang="ts">
  import '../app.css'; // global styles
  import ToastContainer from '$lib/components/ToastContainer.svelte';
</script>

<slot /> <!-- renders all pages -->
<ToastContainer />

