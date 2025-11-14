<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import DashboardCard from '$lib/components/DashboardCard.svelte';

	//-- dummy data for dashboard cards --
	const dashboardCards = [
		{
			title: 'Account',
			description: 'Manage user accounts',
			icon: 'bi-person-fill',
			color: '#1E63E9',
			href: '/executive-account'
		},
		{
			title: 'Role Management',
			description: 'manage user roles',
			icon: 'bi-shield-lock-fill',
			color: '#22C55E',
			href: '/executive-role'
		},
		{
			title: 'Landmarks',
			description: 'Configure location landmarks',
			icon: 'bi-geo-alt-fill',
			color: '#6366F1',
			href: '/landmark'
		},
		{
			title: 'Global Fare',
			description: 'Manage fare structures',
			icon: 'bi-currency-rupee',
			color: '#A855F7',
			href: '/global-fare'
		},
		{
			title: 'Company',
			description: 'Manage company details',
			icon: 'bi-building',
			color: '#6B7280',
			href: '/company'
		}
	];
</script>

<div class="page-wrapper d-flex flex-column min-vh-100">
	<HeaderBar />

	<main class="dashboard-container">
		<section class="dashboard-content container-fluid">
			<div class="dashboard-header row px-3 px-lg-0">
				<div class="col-12 col-sm-10 mt-4 mt-md-0 col-md-8 col-lg-7 col-xl-6">
					<h3 class="fw-inter-700">Welcome back, John!</h3>
					<p>Manage your executive dashboard and business operations from here.</p>
				</div>
			</div>

			<div class="dashboard-grid row g-3 g-md-4 mt-1 mt-md-2">
				{#each dashboardCards as card}
					<div class="col-6 col-sm-6 col-md-4 col-lg-3">
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
</div>

<style>
	.page-wrapper {
		background: var(--bg-primary);
	}

	.dashboard-content {
		padding: 1rem 0.75rem;
	}

	@media (min-width: 768px) {
		.dashboard-content {
			padding: 2rem 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.dashboard-content {
			padding: 3rem 7rem;
		}
	}

	.dashboard-header h3 {
		font-size: 1.75rem;
		color: var(--text-primary);
	}

	@media (max-width: 767px) {
		.dashboard-header h3 {
			font-size: 1.3rem;
			margin-bottom: 0.5rem;
		}
	}

	.dashboard-header p {
		font-size: 1rem;
		color: var(--text-muted);
		margin-bottom: 0;
	}

	@media (max-width: 767px) {
		.dashboard-header p {
			font-size: 0.9rem;
		}
	}

	.dashboard-grid {
		flex: 1;
	}

	@media (max-width: 1023px) {
		.dashboard-grid {
			margin-top: 1rem;
		}
	}
</style>