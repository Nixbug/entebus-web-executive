<script lang="ts">

	export let title: string;
	export let subtitle: string;
	export let buttonLabel: string;
	export let icon: string = "bi-plus-lg";
	export let onButtonClick: (() => void) | undefined = undefined;
</script>

<div class="d-flex justify-content-between align-items-center mb-4">
	<div>
		<h3 class=" fw-inter-700 mt-3 mb-1">{title}</h3>
		<p class=" mb-0">{subtitle}</p>
	</div>
	<div>
		<button class="btn btn-primary fw-inter-700 d-none d-md-block" type="button" on:click={onButtonClick}>
			<i class={`bi ${icon} me-1`}></i> {buttonLabel}
		</button>
	</div>
</div>
<style>
h3{
    color: var(--text-primary);
}
p{
    color: var(--text-muted);
}
button{
    border-radius: 15px;
}
</style>