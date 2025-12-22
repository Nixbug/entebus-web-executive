<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import DashboardCard from '$lib/components/DashboardCard.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const handleClick = () => {
		goto('/company');
	};
	let companyName = 'Company';
	$: companyName =
		$page.url.searchParams.get('name') ?? $page.url.searchParams.get('company') ?? 'Company';

	const dashboardCards = [
		{
			title: 'Account',
			description: 'Manage operator accounts',
			icon: 'bi-person-fill',
			color: '#1E63E9',
			href: '/operator-account'
		},
		{
			title: 'Role Management',
			description: 'Manage operator roles',
			icon: 'bi-shield-lock-fill',
			color: '#22C55E',
			href: '/operator-role'
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
					<div class="col-12 col-md-8 col-lg-7 col-xl-6 mt-4 dashboard-header">
						<button
							class="btn p-0 back-btn mb-2"
							aria-label="Back to Companies"
							on:click={handleClick}
						>
							<i class="bi bi-arrow-left back-icon"></i>
						</button>
						<h2 class="fw-inter-700">Welcome to, {companyName}</h2>
						<p>Manage your company dashboard and business operations from here.</p>
					</div>
				</div>

				<div class="row g-3 g-md-4 mt-2">
					{#each dashboardCards as card}
						<div class="col-6 col-md-4 col-lg-3">
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

	.dashboard-header h2 {
		color: var(--text-primary);
	}
	.dashboard-header p {
		color: var(--text-muted);
	}
	@media (max-width: 1200px) {
		.dashboard-content {
			padding: 1rem 1.5rem;
		}
	}

	.back-btn {
		width: 40px;
		height: 40px;
		border-radius: 15px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--bg-card);
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.05),
			0 0 0 1px rgba(0, 0, 0, 0.08);
		transition: all 0.2s ease;
		border: 1px solid var(--border);
	}

	.back-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
		outline: var(--home-button-bg) solid 2px;
	}

	.back-icon {
		font-size: 1.5rem;
		color: var(--text-muted);
	}
	.back-icon:hover {
		color: var(--home-button-bg);
	}
</style>
