<script lang="ts" generics="T extends Record<string, any>">
	import type { ColumnConfig, FilterType } from '$lib/type';
	import {
		getLabel,
		getFilter,
		getSelectOptions,
		getSelectDefault,
		getWidth,
		getMinWidth
	} from '$lib/helper';
	export let columnConfigs: ColumnConfig<keyof T>[];
	export let data: T[];
	export let visibleColumns: (keyof T)[];
	export let searchTerms: Partial<Record<keyof T, string>> = {};
	export let selectFilters: Partial<Record<keyof T, string>> = {};

	//-- Initialize filters reactively --
	$: visibleColumns.forEach((col) => {
		if (!(col in searchTerms)) searchTerms[col] = '';
		if (getFilter(col, columnConfigs) !== 'text' && !(col in selectFilters)) {
			selectFilters[col] = getSelectDefault(col, columnConfigs);
		}
	});
</script>

<div class="card p-3 shadow-sm border-0">
	<table class="table table-hover align-middle mb-0 custom-table">
		<thead>
			<!-- Header row -->
			<tr>
				{#each visibleColumns as col}
					<th
						class="text-center text-secondary fw-inter-800"
						style="
                            width: {getWidth(col, columnConfigs)};
                            min-width: {getMinWidth(col, columnConfigs)};
                            "
					>
						{getLabel(col, columnConfigs)}
					</th>
				{/each}
			</tr>

			<!-- Filter row -->
			<tr class="search-row">
				{#each visibleColumns as col}
					<td
						class="p-1"
						style="
      width: {getWidth(col, columnConfigs)};
      min-width: {getMinWidth(col, columnConfigs)};
    "
					>
						{#if getFilter(col, columnConfigs) === 'text'}
							<input
								class="form-control p-2 form-control-sm text-center"
								placeholder="Search"
								bind:value={searchTerms[col]}
							/>
						{:else}
							<!-- SELECT FILTER -->
							<div class="dropdown border rounded custom-select-dropdown">
								<button
									class="btn btn-light dropdown-toggle w-100"
									type="button"
									data-bs-toggle="dropdown"
									aria-expanded="false"
								>
									{selectFilters[col] ?? 'All'}
								</button>
								<ul class="dropdown-menu p-2 w-100">
									{#each getSelectOptions(col, columnConfigs) as opt}
										<li>
											<button
												class="dropdown-item"
												class:active={selectFilters[col] === opt}
												type="button"
												on:click={() => (selectFilters[col] = opt)}
											>
												{opt}
											</button>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</td>
				{/each}
			</tr>
		</thead>

		<tbody>
			{#each data as row (row.id ?? row)}
				<tr>
					{#each visibleColumns as col}
						<td
							class="text-center text-truncate"
							style="
      width: {getWidth(col, columnConfigs)};
      min-width: {getMinWidth(col, columnConfigs)};
      max-width: {getWidth(col, columnConfigs, 'none')};
    "
							title={row[col]}
						>
							{row[col] ?? '-'}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.custom-table td,
	.custom-table th {
		padding: 1rem !important;
		vertical-align: middle;
	}
	.custom-table thead tr:first-child th {
		background-color: #e8f5e9 !important;
		border-bottom: 2px solid #b1becc !important;
		font-weight: 700 !important;
	}
	.custom-table tbody tr:first-child td {
		background-color: #9dd84b !important;
	}
	.custom-select-dropdown .dropdown-item.active {
		background: #9dd84b !important;
		color: #fff !important;
		border-radius: 8px;
	}
	.custom-select-dropdown .dropdown-item:hover {
		background: #b8e986;
		color: #000;
		border-radius: 8px;
	}
</style>
