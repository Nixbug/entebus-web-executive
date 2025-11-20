<script lang="ts">
	import type { ComponentType } from 'svelte';
	export let columns: { key: string; label: string; isChip?: boolean }[] = [];
	export let data: any[] = [];
	export let visibleColumns: string[] = [];
	export let customRender: Record<string, ComponentType | null> = {};
</script>

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
					<tr>
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
											<!-- single value → render as one chip -->
											<span class="chip">{row[key]}</span>
										{/if}
									</div>
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
		<p class="text-center py-4 mb-0" style="color: var(--text-muted);">No executives found.</p>
	{/if}
</div>

<style>
	.card {
		background-color: var(--bg-card);
		border: 1px solid var(--border);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--border) 80%, transparent) !important;
	}
	thead th {
		background-color: var(--bg-card);
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
		background-color: rgba(255, 255, 255, 0.03);
	}
	.chip {
		padding: 2px 10px;
		border-radius: 8px;
		font-size: 12px;
		background-color: var(--bg-primary, #e0e0e0);
		color: var(--text-muted, #333);
	}
</style>
