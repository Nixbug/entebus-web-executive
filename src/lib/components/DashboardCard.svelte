<script lang="ts">
	export let title: string;
	export let description: string;
	export let icon: string;
	export let color: string = '#0d6efd';
	export let href: string = '#';
</script>

<a
	{href}
	class="dashboard-card text-decoration-none d-flex flex-column align-items-start justify-content-start"
>
	<div
		class="icon-wrapper d-flex align-items-center justify-content-center rounded-3 mb-4"
		style="background-color: {color}15;"
	>
		<i class={icon} style="color: {color};"></i>
	</div>

	<h5 class="card-title fw-inter-700 mb-2 text-truncate w-100">{title}</h5>
	<p class="card-desc mb-0">{description}</p>
</a>

<style>
	.dashboard-card {
		background: var(--bg-card, #fff);
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		padding: 28px 24px;
		height: 200px;
		transition: all 0.2s ease-in-out;
		color: var(--text-primary);
		border: 1px solid transparent;
	}

	.dashboard-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
		border-color: var(--bg-card);
		text-decoration: none;
		color: var(--text-primary);
	}

	.icon-wrapper {
		width: 52px;
		height: 52px;
		flex-shrink: 0;
	}

	.icon-wrapper i {
		font-size: 22px;
	}

	.card-title {
		font-size: 1.05rem;
		white-space: nowrap;
		color: var(--text-primary);
	}

	.card-desc {
		font-size: 0.9rem;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
		color: var(--text-muted);
	}
</style>
