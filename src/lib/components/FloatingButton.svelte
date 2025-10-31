<script>
	export let icon = 'bi-plus-lg'; // Bootstrap icon class
	export let size = '56px'; // Size of button
	export let position = 'bottom-0 end-0'; // Bootstrap position utilities
	export let onClick = () => {}; // Click event handler
	export let tooltip = ''; // Optional tooltip text
</script>

<!-- Floating Action Button -->
<button
	class="btn rounded-circle position-fixed {position} m-3 shadow d-flex align-items-center justify-content-center"
	style="width:{size}; height:{size}; z-index:1050;"
	on:click={onClick}
	title={tooltip}
>
	<i class="bi {icon} fs-4 text-white"></i>
</button>

<style>
    button,
    button:hover,
    button:active {
        background-color: #279bda;
    }
</style>