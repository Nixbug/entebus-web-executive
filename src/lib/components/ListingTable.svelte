<script lang="ts">
	import type { ComponentType } from 'svelte';
	export let columns: { key: string; label: string; isChip?: boolean }[] = [];
	export let data: any[] = [];
	export let visibleColumns: string[] = [];
	export let customRender: Record<string, ComponentType | null> = {};
	export let tableName: string;
</script>

<!-- Table -->
<div class="card rounded-4 overflow-hidden border-0">
	<div class="table-responsive">
		<table class="table align-middle table-borderless mb-0">
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
					<tr class:is-you-row={row.isYou}>
						{#each visibleColumns as key}
							<td class="px-4 py-3">
								{#if customRender[key]}
									<svelte:component this={customRender[key]} {row} />
								{:else if columns.find((c) => c.key === key)?.isChip}
									<div class="d-flex flex-wrap gap-2">
										{#if Array.isArray(row[key])}
											{#each row[key] as chip}
												<span class="chip">{chip}</span>
											{/each}
										{:else}
											<span class="chip">{row[key]}</span>
										{/if}
									</div>
								{:else if key === 'id'}
									<span style="color: var(--text-primary); font-weight: 600;">
										{row[key]}
									</span>
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
		<div class="d-flex flex-column align-items-center justify-content-center py-5 gap-2">
			<div
				class="d-flex align-items-center justify-content-center rounded-circle"
				style="width:70px; height:70px; background:var(--bg-primary);"
			>
				<i class="bi bi-search fs-2" style="color:var(--text-muted);"></i>
			</div>

			<h5 class="m-0" style="color:var(--text-primary);">No {tableName} found</h5>
			<p class="m-0 small" style="color:var(--text-muted);">Try adjusting your search or filters</p>
		</div>
	{/if}
</div>

<!-- Styles -->
<style>
	.card {
		background-color: var(--bg-card);
		border: 1px solid var(--border);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--border) 70%, transparent) !important;
	}
	thead th {
		background-color: var(--bg-primary);
		color: var(--text-primary);
		border-bottom: 2px solid var(--border);
	}
	tbody td {
		background-color: var(--bg-card);
		color: var(--text-muted);
		border: none;
		border-bottom: 1px solid var(--border);
	}
	tbody tr:hover td {
		background-color: var(--table-hover-bg);
	}
	.chip {
		padding: 2px 10px;
		border-radius: 8px;
		font-size: 12px;
		background-color: var(--bg-primary, #e0e0e0);
		color: var(--text-muted, #333);
	}
	.is-you-row td {
		background-color: rgba(0, 140, 255, 0.048) !important;
	}

	.is-you-row:hover td {
		background-color: rgba(0, 140, 255, 0.09) !important;
	}
</style>
