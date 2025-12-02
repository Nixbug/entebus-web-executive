<script lang="ts">
	export let totalItems: number;
	export let itemsPerPage: number = 10;
	export let currentPage: number = 1;
	export let onPageChange: (page: number) => void;

	const totalPages = Math.ceil(totalItems / itemsPerPage);

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages && page !== currentPage) {
			onPageChange(page);
		}
	}

	function getPageNumbers() {
		const pages: (number | string)[] = [];
		const show = 2;
		pages.push(1);
		if (currentPage > show + 2) {
			if (pages[pages.length - 1] !== '...') pages.push('...');
		}
		const start = Math.max(2, currentPage - show);
		const end = Math.min(totalPages - 1, currentPage + show);
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		if (currentPage < totalPages - show - 1) {
			if (pages[pages.length - 1] !== '...') pages.push('...');
		}
		if (totalPages > 1) pages.push(totalPages);
		return pages;
	}
</script>

{#if totalPages > 1}
	<nav class="d-flex justify-content-center align-items-center gap-2 mt-4">
		<!-- Previous -->
		<button
			class="btn px-3 py-1 d-flex align-items-center gap-1"
			disabled={currentPage === 1}
			on:click={() => goToPage(currentPage - 1)}
			style="border:none; color: var(--text-primary);"
		>
			<i class="bi bi-chevron-left"></i> Previous
		</button>

		<!-- Smart Page Numbers (only ~10 items max!) -->
		{#each getPageNumbers() as item}
			{#if item === '...'}
				<span class="px-2 text-muted">...</span>
			{:else}
				<button
					class="btn btn-page"
					class:active={currentPage === item}
					on:click={() => goToPage(item as number)}
				>
					{item}
				</button>
			{/if}
		{/each}

		<!-- Next -->
		<button
			class="btn px-3 py-1 d-flex align-items-center gap-1"
			disabled={currentPage === totalPages}
			on:click={() => goToPage(currentPage + 1)}
			style="border:none; color: var(--text-primary);"
		>
			Next <i class="bi bi-chevron-right"></i>
		</button>
	</nav>
{/if}

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
