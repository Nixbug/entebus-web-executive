<script lang="ts">
	export let title: string;
	export let description: string;
	export let icon: string;
	export let color: string = '#0d6efd';
	export let href: string = '#';
</script>

<a href={href} class="dashboard-card text-decoration-none">
	<div class="icon-wrapper" style="background-color: {color}15;">
		<i class="{icon}" style="color: {color};"></i>
	</div>

	<h5 class="card-title">{title}</h5>
	<p class="card-desc">{description}</p>
</a>

<style>
	.dashboard-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		background: var(--bg-card, #fff);
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		padding: 28px 24px;
		height: 200px;
		transition: all 0.2s ease-in-out;
		color: var(--text-primary);
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.dashboard-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
		border-color: #e0e0e0;
	}

	.icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		border-radius: 12px;
		margin-bottom: 16px;
		flex-shrink: 0;
	}

	.icon-wrapper i {
		font-size: 22px;
	}

	.card-title {
		font-size: 1.05rem;
		font-weight: 600;
		margin: 0 0 6px 0;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
	}

	.card-desc {
		font-size: 0.9rem;
		color: var(--text-muted);
		line-height: 1.5;
		margin: 0;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
