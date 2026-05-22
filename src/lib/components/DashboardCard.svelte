<script lang="ts">
	export let title: string;
	export let description: string;
	export let icon: string;
	export let color: string = '#0d6efd';
	export let href: string = '#';
</script>

<a
	{href}
	class="dashboard-card text-decoration-none d-flex flex-column
        align-items-center align-items-lg-start
        justify-content-start
        text-center text-lg-start"
>
	<div
		class="icon-wrapper d-flex align-items-center justify-content-center rounded-3 mb-3"
		style="background-color: {color}15;"
	>
		<i class={icon} style="color: {color};"></i>
	</div>
	<h5 class="card-title fw-inter-700 mb-2 w-100">{title}</h5>
	<p class="card-desc mb-0 w-100">{description}</p>
</a>

<!-- Styles -->
<style>
	.dashboard-card {
		background: var(--bg-card, #fff);
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		padding: 1.5rem 1rem;
		height: 100%;
		min-height: 180px;
		transition: all 0.2s ease-in-out;
		color: var(--text-primary);
		border: 1px solid var(--border);
	}

	.dashboard-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
		border-color: var(--bg-card);
		text-decoration: none;
		color: var(--text-primary);
		border: 1px solid var(--border);
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
		font-size: 1rem;
		color: var(--text-primary);
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.card-desc {
		font-size: 0.9rem;
		line-height: 1.4;
		color: var(--text-muted);
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	/*-- Mobile-first responsive adjustments --*/
	@media (max-width: 767px) {
		.dashboard-card {
			padding: 1.25rem 0.75rem;
			min-height: 160px;
			border-radius: 12px;
		}
		.icon-wrapper {
			width: 44px;
			height: 44px;
			margin-bottom: 0.75rem;
		}
		.icon-wrapper i {
			font-size: 18px;
		}
		.card-title {
			font-size: 0.9rem;
			margin-bottom: 0.5rem;
		}
		.card-desc {
			font-size: 0.8rem;
			line-height: 1.3;
		}
	}
	/*-- Tablet adjustments --*/
	@media (min-width: 768px) and (max-width: 1023px) {
		.dashboard-card {
			padding: 1.5rem 1rem;
			min-height: 170px;
		}
	}
	/*-- Ensure content doesn't overflow on very small screens --*/
	@media (max-width: 375px) {
		.dashboard-card {
			padding: 1rem 0.5rem;
			min-height: 150px;
		}
		.card-title {
			font-size: 0.85rem;
		}

		.card-desc {
			font-size: 0.75rem;
		}
	}
</style>
