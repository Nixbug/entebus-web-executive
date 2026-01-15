<script lang="ts">
	export let icon = 'bi-plus-lg';
	export let size = '56px';
	export let position = 'bottom-0 end-0';
	export let onClick = () => {};
	export let tooltip = '';
	export let isInitiallyEnabled: boolean = true;
</script>

<!-- Floating Action Button -->
<span
	title={!isInitiallyEnabled ? tooltip : undefined}
	style={`display: inline-block;${!isInitiallyEnabled ? ' cursor: not-allowed;' : ''}`}
>
	<button
		class="btn rounded-circle position-fixed {position} m-3 shadow d-flex align-items-center bg-primary justify-content-center"
		style="width:{size}; height:{size}; z-index:var(--home-button-z-index);"
		on:click={onClick}
		title={tooltip}
		aria-label={tooltip}
		disabled={!isInitiallyEnabled}
		aria-disabled={!isInitiallyEnabled}
	>
		<i class="bi {icon} fs-4 text-white"></i>
	</button>
</span>
