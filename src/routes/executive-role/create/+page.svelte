<script lang="ts">
	import RoleCreate from '$lib/permissions/RoleForm.svelte';
    import HeaderBar from '$lib/components/HeaderBar.svelte';
	import { goto } from '$app/navigation';

	function onSave(_e: any) {
		goto('/executive-role');
	}

	function onCancel() {
		goto('/executive-role');
	}
</script>

<HeaderBar />
<RoleCreate on:save={onSave} on:cancel={onCancel} />
