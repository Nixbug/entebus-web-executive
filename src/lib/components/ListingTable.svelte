<script lang="ts">
	import type { ComponentType } from 'svelte';
	export let columns: { key: string; label: string }[] = [];
	export let data: any[] = [];
	export let visibleColumns: string[] = [];
	export let customRender: Record<string, ComponentType | null> = {};
</script>

<div class="card shadow-sm rounded-4 overflow-hidden">
	<div >
		<div class="table-responsive">
			<table class="table align-middle mb-0" >
				<thead>
					<tr>
						{#each visibleColumns as key}
							<th class="fw-semibold small text-secondary px-4 py-3" style="background-color: var(--bg-card);">
								{columns.find((c) => c.key === key)?.label}
							</th>
						{/each}
					</tr>
				</thead>

				<tbody >
					{#each data as row, i}
						<tr>
							{#each visibleColumns as key}
								<td class="px-4 py-3"  style="background-color: var(--bg-card); color: var(--text-primary);">
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
			<p class="text-center text-muted py-4 mb-0">No results found.</p>
		{/if}
	</div>
</div>

