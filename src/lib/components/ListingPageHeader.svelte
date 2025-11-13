<script lang="ts">

	export let title: string;
	export let subtitle: string;
	export let buttonLabel: string;
	export let icon: string = "bi-plus-lg";
	export let onButtonClick: (() => void) | undefined = undefined;
</script>

<div class="d-flex justify-content-between align-items-center mb-4">
	<div>
		<h1 class="h2 fw-inter-700 mb-1">{title}</h1>
		<p class=" mb-0">{subtitle}</p>
	</div>
	<div>
		<button class="btn btn-primary d-none d-md-block" type="button" on:click={onButtonClick}>
			<i class={`bi ${icon} me-1`}></i> {buttonLabel}
		</button>
	</div>
</div>
<style>
h1{
    color: var(--text-primary);
}
p{
    color: var(--text-muted);
}
button{
    border-radius: 15px;
}
</style>