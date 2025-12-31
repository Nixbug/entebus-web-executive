<script lang="ts">
	export let title: string;
	export let subtitle: string;
	export let buttonLabel: string;
	export let icon: string = 'bi-plus-lg';
	export let isInitiallyEnabled: boolean = true;
	export let disabledTooltip: string = '';
	export let onButtonClick: (() => void) | undefined = undefined;
</script>

<!-- Header -->
<div class="d-flex justify-content-between align-items-center mb-4">
	<div>
		<h1 class="fw-inter-700 mt-3 mb-1">{title}</h1>
		<p class="mb-0">{subtitle}</p>
	</div>
	<div>
		{#if isInitiallyEnabled}
			<button
				class="btn btn-primary fw-inter-600 d-none d-md-block"
				type="button"
				on:click={onButtonClick}
			>
				<i class={`bi ${icon} me-2`}></i>
				{buttonLabel}
			</button>
		{/if}
		{#if !isInitiallyEnabled}
			<span
				class="d-none d-md-block"
				title={disabledTooltip}
				style="cursor: not-allowed; display: inline-block;"
			>
				<button
					class="btn btn-primary fw-inter-600"
					type="button"
					on:click={onButtonClick}
					disabled
					aria-disabled="true"
				>
					<i class={`bi ${icon} me-2`}></i>
					{buttonLabel}
				</button>
			</span>
		{/if}
	</div>
</div>

<!-- Styles -->
<style>
	h1 {
		font-size: 1.5rem;
		color: var(--text-primary);
	}
	p {
		font-size: 15px;
		color: var(--text-muted);
	}
	button {
		font-size: 14px;
		padding: 8px 12px;
		border-radius: 15px;
		height: 40px;
	}
	button[disabled],
	button:disabled {
		cursor: not-allowed;
	}
</style>
