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
</script>

{#if totalPages > 1}
	<nav class="d-flex justify-content-center align-items-center gap-2 mt-4">
		<!-- Previous -->
		<button
			class="btn px-3 py-1 d-flex align-items-center gap-1"
			disabled={currentPage === 1}
			on:click={() => goToPage(currentPage - 1)}
			style=" border:none; color: var(--text-primary);"
		>
			<i class="bi bi-chevron-left"></i> Previous
		</button>

		<!-- Page Numbers -->
		{#each Array(totalPages) as _, i}
			<button
				class="btn btn-page"
				class:active={currentPage === i + 1}
				on:click={() => goToPage(i + 1)}
			>
				{i + 1}
			</button>
		{/each}

		<!-- Next -->
		<button
			class="btn px-3 py-1 d-flex align-items-center gap-1"
			disabled={currentPage === totalPages}
			on:click={() => goToPage(currentPage + 1)}
			style=" border:none; color: var(--text-primary);"
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
	}

	.btn-page.active {
		background-color: var(--bg-card);
		color: var(--text-primary);
		border-radius: 10px;
		border: 1px solid var(--border);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
