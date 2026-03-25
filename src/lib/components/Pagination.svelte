<script lang="ts">
	export let totalItems: number | undefined = undefined;
	export let itemsPerPage: number = 10;
	export let currentPage: number = 1;
	export let hasMore: boolean = false;
	export let onPageChange: (page: number) => void;

	$: totalPages = (() => {
		if (typeof totalItems === 'number') {
			const calculated = Math.max(1, Math.ceil(totalItems / itemsPerPage));
			if (hasMore) {
				return Math.max(calculated, currentPage + 1);
			}
			return calculated;
		}
		if (hasMore) {
			return currentPage + 1;
		}
		return 1;
	})();

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages && page !== currentPage) {
			onPageChange(page);
		}
	}

	//-- Calculate the page buttons to display --
	$: pageButtons = [
		currentPage > 1 ? currentPage - 1 : null,
		currentPage,
		currentPage < totalPages ? currentPage + 1 : null
	].filter((x): x is number => x !== null);
</script>

{#if totalPages > 1}
	<nav class="d-flex justify-content-center align-items-center gap-2 mt-4">
		<!-- Previous -->
		<button
			class="btn px-3 py-1 d-flex align-items-center gap-1"
			disabled={currentPage === 1}
			on:click={() => goToPage(currentPage - 1)}
			style="border:none; color: var(--text-primary);"
			aria-label="Go to previous page"
		>
			<i class="bi bi-chevron-left"></i> Previous
		</button>

		<!-- Only the 3 relevant pages -->
		{#each pageButtons as page}
			<button
				class="btn btn-page"
				class:active={currentPage === page}
				on:click={() => goToPage(page)}
				aria-label={currentPage === page ? `Current page ${page}` : `Go to page ${page}`}
				aria-current={currentPage === page ? 'page' : undefined}
			>
				{page}
			</button>
		{/each}

		<!-- Next -->
		<button
			class="btn px-3 py-1 d-flex align-items-center gap-1"
			disabled={!hasMore && currentPage === totalPages}
			on:click={() => goToPage(currentPage + 1)}
			style="border:none; color: var(--text-primary);"
			aria-label="Go to next page"
		>
			Next <i class="bi bi-chevron-right"></i>
		</button>
	</nav>
{/if}

<!-- Styles -->
<style>
	.btn-page {
		border: none;
		color: var(--text-primary);
		margin: 0 4px;
		padding: 6px 12px;
		border-radius: 4px;
		cursor: pointer;
		min-width: 40px;
	}

	.btn-page.active {
		background-color: var(--bg-card);
		color: var(--text-primary);
		border-radius: 10px;
		border: 1px solid var(--border);
	}

	.btn-page:hover:not(.active) {
		background-color: rgba(0, 0, 0, 0.05);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
