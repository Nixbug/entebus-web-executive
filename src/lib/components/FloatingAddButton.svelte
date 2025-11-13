<script>
	export let icon = 'bi-plus-lg';
	export let size = '56px';
	export let position = 'bottom-0 end-0';
	export let onClick = () => {};
	export let tooltip = '';
</script>

<!-- Floating Action Button -->
<button
	class="btn rounded-circle position-fixed {position} m-3 shadow d-flex align-items-center bg-primary justify-content-center"
	style="width:{size}; height:{size}; z-index:1050;"
	on:click={onClick}
	title={tooltip}
>
	<i class="bi {icon} fs-4 text-white"></i>
</button>