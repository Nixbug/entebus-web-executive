<script lang="ts">
	import type { ComponentType } from 'svelte';
	export let columns: { key: string; label: string }[] = [];
	export let data: any[] = [];
	export let visibleColumns: string[] = [];
	export let customRender: Record<string, ComponentType | null> = {};
</script>

<div class="card rounded-4 overflow-hidden border-0 ">
	<div class="table-responsive">
		<table class="table align-middle table-borderless mb-0 ">
			<thead>
				<tr>
					{#each visibleColumns as key}
						<th class="fw-inter-700 small px-4 py-3">
							{columns.find((c) => c.key === key)?.label}
						</th>
					{/each}
				</tr>
			</thead>

			<tbody>
				{#each data as row}
					<tr>
						{#each visibleColumns as key}
							<td class="px-4 py-3">
								{#if customRender[key]}
									<svelte:component this={customRender[key]} {row} />
								{:else}
									{row[key]}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.length === 0}
		<p class="text-center py-4 mb-0" style="color: var(--text-muted);">No results found.</p>
	{/if}
</div>

<style>
	.card {
		background-color: var(--bg-card);
		border: 1px solid var(--border);
	}
	thead th {
		background-color: var(--bg-card);
		color: var(--text-primary);
		font-weight: 600;
		border-bottom: 2px solid var(--border);
	}
	tbody td {
		background-color: var(--bg-card);
		color: var(--text-muted);
		border: none;
		border-bottom: 1px solid var(--border);
	}
	tbody tr:hover td {
		background-color: rgba(255, 255, 255, 0.03);
	}
</style>
