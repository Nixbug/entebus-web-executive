<script lang="ts">
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import HomeButton from '$lib/components/HomeButton.svelte';
	import ListingPageHeader from '$lib/components/ListingPageHeader.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import { applySearchAndFilters } from '$lib/helpers';
	import FloatingAddButton from '$lib/components/FloatingAddButton.svelte';
	import { landmarks } from '$lib/dummy-data';
	import type { Landmark } from '$lib/types/type';
	import EmptyData from '$lib/components/EmptyData.svelte';
	import MapPreview from '$lib/components/MapPreview.svelte';
	//-- Pagination setup --
	let currentPage = 1;
	let itemsPerPage = 10;

	let filtered = [...landmarks];
	let paginated: Landmark[] = [];

	$: {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		paginated = filtered.slice(start, end);
	}

	function handlePageChange(p: number) {
		currentPage = p;
	}

	//-- Search/Filter setup --
	let searchTerm = '';
	let activeFilters = {};
	const filters = [
		{
			label: 'Type',
			key: 'type',
			options: ['All Types', 'Local', 'Village', 'District', 'State', 'National']
		}
	];
	//-- Handle search/filter updates --
	function handleSearchAndFilterUpdate(event: CustomEvent) {
		searchTerm = event.detail.searchTerm;
		activeFilters = event.detail.activeFilters;
		filtered = applySearchAndFilters(landmarks, searchTerm, {
			searchKeys: ['name', 'id'],
			filters: activeFilters
		});

		currentPage = 1;
	}
</script>

<div class="main-div d-flex flex-column min-vh-100">
	<div class="d-flex flex-column">
		<div class="sticky-top">
			<HeaderBar />
		</div>
		<main class="container-xl py-5 page-wrapper">
			<!-- HOME BUTTON -->
			<HomeButton />
			<!-- PAGE HEADER -->
			<ListingPageHeader
				title="Landmark Management"
				subtitle="View and manage all landmarks"
				buttonLabel="Add Landmark"
				icon="bi-plus-lg"
			/>
			<!-- SEARCH & FILTER BAR -->
			<SearchFilterBar
				searchPlaceholder="Search by name, ID, designation, or email..."
				{filters}
				on:update={handleSearchAndFilterUpdate}
			/>
			<div class="landmark-layout row g-4">
				<!-- Left column: list -->
				<div class="col-12 col-lg-7">
					{#each paginated as landmark}
						<div
							class="landmark-card d-flex align-items-center justify-content-between mb-3"
							role="button"
							tabindex="0"
						>
							<!-- Left section -->
							<div class="d-flex align-items-center gap-3">
								<!-- Icon -->
								<div class="landmark-icon">
									<i class="bi bi-geo-alt-fill"></i>
								</div>

								<!-- Info -->
								<div class="landmark-info">
									<div class="landmark-name fw-inter-700">{landmark.name}</div>
									<div class="landmark-id">{landmark.id}</div>
								</div>
							</div>

							<!-- Right section -->
							<div class="d-flex align-items-center gap-3">
								<span class="landmark-badge {landmark.type.toLowerCase()} fw-inter-600">
									{landmark.type}
								</span>
								<i class="bi bi-chevron-right text-secondary"></i>
							</div>
						</div>
					{/each}

					{#if paginated.length === 0}
						<EmptyData message="No Landmarks found" />
					{/if}

					<FloatingAddButton tooltip="Add new landmark" />
				</div>

				<!-- Right column: map preview -->
				<div class="col-12 col-lg-5">
					<MapPreview />
				</div>
			</div>
		</main>
	</div>
</div>

<!-- Styles -->
<style>
	.main-div {
		background-color: var(--bg-primary);
		position: relative;
	}
	@media (max-width: 768px) {
		main {
			padding: 2rem;
		}
	}
	@media (max-width: 1200px) {
		.page-wrapper {
			padding: 2rem;
		}
	}
	.landmark-card {
		background: var(--bg-card);
		padding: 1rem 1.25rem;
		border-radius: 1rem;
		cursor: pointer;
		transition:
			box-shadow 0.2s ease,
			transform 0.1s ease;
	}

	.landmark-card:hover {
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
		transform: translateY(-1px);
	}

	.landmark-icon {
		width: 48px;
		height: 48px;
		border-radius: 14px;
		background: linear-gradient(135deg, #00b3a4, #00a0c6);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 1.2rem;
	}

	/* Info */
	.landmark-name,
	.landmark-id {
		color: var(--text-primary);
	}

	.landmark-badge {
		font-size: 0.65rem;
		padding: 0.3rem 0.75rem;
		border-radius: 10px;
		white-space: nowrap;
		background-color: #00b3a4;
		color: white;
	}
</style>
