<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import DashboardCard from '$lib/components/DashboardCard.svelte';

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
			description: 'Manage user roles',
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
	<!-- Header already has container-xl inside -->
	<HeaderBar />

	<!-- USE ONLY ONE container-xl -->
	<div class="container-xl">
		<main class="dashboard-container py-4">
			<section class="dashboard-content">
				<div class="row">
					<div class="col-12 col-md-8 col-lg-7 col-xl-6 mt-4">
						<h2 class="fw-inter-700">Welcome back, John!</h2>
						<p>Manage your executive dashboard and business operations from here.</p>
					</div>
				</div>

				<div class="row g-3 g-md-4 mt-2">
					{#each dashboardCards as card}
						<div class="col-6 col-sm-6 col-md-4 col-lg-3">
							<DashboardCard {...card} />
						</div>
					{/each}
				</div>
			</section>
		</main>
	</div>
</div>

<style>
	.page-wrapper {
		background: var(--bg-primary);
	}

	.dashboard-content {
		padding: 0;
	}

	h2 {
		color: var(--text-primary);
	}
	p {
		color: var(--text-muted);
	}
	@media (max-width: 1200px) {
		.dashboard-content {
			padding: 1rem 1.5rem;
		}
	}
</style>
