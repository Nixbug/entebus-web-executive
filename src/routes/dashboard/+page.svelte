<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import DashboardCard from '$lib/components/DashboardCard.svelte';

	const dashboardCards = [
		{
			title: 'Account',
			description: 'Manage user accounts',
			icon: 'bi-person-fill',
			color: '#0d6efd',
			href: '/executive-account'
		},
		{
			title: 'Role Management',
			description: 'manage user roles',
			icon: 'bi-shield-lock-fill',
			color: '#198754',
			href: '/executive-role'
		},
		{
			title: 'Landmarks',
			description: 'Configure location landmarks',
			icon: 'bi-geo-alt-fill',
			color: '#6f42c1',
			href: '/landmark'
		},
		{
			title: 'Global Fare',
			description: 'Manage fare structures',
			icon: 'bi-currency-rupee',
			color: '#fd7e14',
			href: '/global-fare'
		},
		{
			title: 'Company',
			description: 'Manage company details',
			icon: 'bi-building',
			color: '#6c757d',
			href: '/company'
		}
	];
</script>

<HeaderBar />

<main class="dashboard-container">
	<section class="dashboard-content container-fluid">
		<div class="dashboard-header row">
			<div class="col-12 col-sm-10 col-md-8 col-lg-7 col-xl-6">
				<h2>Welcome back, John!</h2>
				<p>Manage your executive dashboard and business operations from here.</p>
			</div>
		</div>

		<div class="dashboard-grid row g-4 mt-1">
			{#each dashboardCards as card}
				<div class="col-12 col-sm-6 col-md-4 col-lg-3">
					<DashboardCard
						title={card.title}
						description={card.description}
						icon={card.icon}
						color={card.color}
						href={card.href}
					/>
				</div>
			{/each}
		</div>
	</section>
</main>

<style>
	.dashboard-container {
		width: 100%;
		min-height: 100vh;
		background: var(--bg-primary);
		display: flex;
		flex-direction: column;
	}

.dashboard-content {
	flex: 1;
	padding: 2rem; /* default for mobile/tablet */
}

@media (min-width: 1024px) {
	.dashboard-content {
		padding: 3rem 7rem; /* desktop view */
	}
}


	.dashboard-header h2 {
		font-weight: 700;
		font-size: 1.75rem;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.dashboard-header p {
		font-size: 1rem;
		color: var(--text-muted);
	}

	/* Keep spacing uniform between cards & header */
	.dashboard-grid {
		margin-top: 2rem;
	}
</style>

