<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { javascript } from '@codemirror/lang-javascript';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { keymap } from '@codemirror/view';
	import { indentWithTab } from '@codemirror/commands';

	//-- Props --
	export let value = '';
	export let ticketTypes: { id: number; name: string }[] = [];
	export let currency = 'INR';
	export let height = '360px';

	let editorContainer: HTMLDivElement;
	let view: EditorView | null = null;
	let theme = 'dark';
	let testDistance = 5;
	let output = '';
	let fareResults: {
		distance: number;
		results: { type: string; fare: number }[];
		distanceBreakdown?: { distance: string; fares: Record<string, number> }[];
	} | null = null;
	let showOutput = false;

	//-- Initialize CodeMirror editor --
	onMount(() => {
		const extensions = [
			basicSetup,
			keymap.of([indentWithTab]),
			javascript(),
			theme === 'dark' ? oneDark : [],
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					value = view?.state.doc.toString() || '';
				}
			})
		];

		view = new EditorView({
			doc: value,
			extensions,
			parent: editorContainer
		});
	});

	//-- Sync external value changes to editor --
	$: if (view && value !== view.state.doc.toString()) {
		view.dispatch({
			changes: {
				from: 0,
				to: view.state.doc.length,
				insert: value
			}
		});
	}

	//-- Cleanup --
	onDestroy(() => {
		view?.destroy();
		view = null;
	});

	//-- Calculate the fare with the provided distance --
	function handleRun() {
		showOutput = true;
		const capturedLogs: string[] = [];
		const mockConsole = { log: (...args: any[]) => capturedLogs.push(args.join(' ')) };

		try {
			if (!/function\s+getFare\s*\(/.test(value)) {
				output = "Error: Function name must be 'getFare'";
				fareResults = null;
				return;
			}

			const createGetFare = new Function('console', `${value}; return getFare;`);
			const calculateFare = createGetFare(mockConsole);

			if (typeof calculateFare !== 'function') {
				output = "Error: 'getFare' is not a valid function";
				fareResults = null;
				return;
			}

			const results = ticketTypes.map((ticketType) => {
				try {
					const fare = calculateFare(ticketType.name, testDistance * 1000, {});
					return { type: ticketType.name, fare };
				} catch {
					return { type: ticketType.name, fare: -1 };
				}
			});

			const distanceBreakdown: { distance: string; fares: Record<string, number> }[] = [];
			for (let distanceKm = 1; distanceKm <= testDistance; distanceKm++) {
				const fares: Record<string, number> = {};
				ticketTypes.forEach((ticketType) => {
					try {
						fares[ticketType.name] = calculateFare(ticketType.name, distanceKm * 1000, {});
					} catch {
						fares[ticketType.name] = -1;
					}
				});
				distanceBreakdown.push({
					distance: distanceKm === 1 ? '1 km' : `${distanceKm - 1}-${distanceKm} km`,
					fares
				});
			}

			fareResults = { distance: testDistance, results, distanceBreakdown };
			output = capturedLogs.length
				? capturedLogs.join('\n') + '\nFare calculation completed.'
				: 'Fare calculation completed.';
		} catch (error) {
			fareResults = null;
			output = `Error: ${error instanceof Error ? error.message : 'Invalid code'}`;
		}
	}
</script>

<!-- Right panel card (contains editor + output table) -->
<div class="card editor-card">
	<div class="card-header">
		<h5 class="mb-2" style="color: var(--text-primary);">Fare Calculation Function</h5>
		<div class="test-controls">
			<label for="testDistance" class="form-label">Test Distance (km):</label>
			<input
				type="number"
				class="distance-input"
				min="1"
				bind:value={testDistance}
				placeholder="km"
			/>
			<button class="btn btn-primary btn-sm" on:click={handleRun}> Calculate </button>
		</div>
	</div>

	<!-- Editor area -->
	<div class="editor-area">
		<div bind:this={editorContainer} class="editor-root" style="height: {height};"></div>
	</div>

	<!-- Output table section -->
	{#if showOutput}
		<div class="output-section">
			<div class="output-header">
				<h6 class="mb-0">Output</h6>
				<button
					class="btn btn-sm btn-outline-danger"
					on:click={() => (showOutput = false)}
					aria-label="Close"
				>
					<i class="bi bi-x-lg"></i>
				</button>
			</div>
			<div class="output-content">
				<pre class="output-text">{output || 'No output yet'}</pre>

				{#if fareResults}
					<div>
						<h6 class="mt-3 mb-2">Results for {fareResults.distance} km:</h6>
						<table class="table">
							<thead>
								<tr>
									<th style="color: var(--text-primary);">Ticket Type</th>
									<th class="text-end" style="color: var(--text-primary);">Fare</th>
								</tr>
							</thead>
							<tbody>
								{#each fareResults.results as res}
									<tr>
										<td>{res.type}</td>
										<td class="text-end">
											{#if res.fare === -1}
												<span class="error">Error</span>
											{:else}
												{res.fare} {currency}
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>

						<h6 class="mt-4 mb-2" style="color: var(--text-primary);">Distance Breakdown:</h6>
						<div class="table-scroll">
							<table class="table">
								<thead>
									<tr>
										<th style="color: var(--text-primary);">Distance</th>
										{#each ticketTypes as ticketType}
											<th class="text-end" style="color: var(--text-primary);">{ticketType.name}</th
											>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each fareResults.distanceBreakdown as row}
										<tr>
											<td>{row.distance}</td>
											{#each ticketTypes as ticketType}
												<td class="text-end">
													{#if row.fares[ticketType.name] === -1}
														<span class="error">-</span>
													{:else}
														{row.fares[ticketType.name]}
													{/if}
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.editor-root {
		width: 100%;
		height: 100%;
		min-height: 320px;
		box-sizing: border-box;
		max-width: 100%;
	}

	:global(.cm-editor) {
		height: 100%;
		min-height: 0;
		font-size: 13px;
		border-radius: 8px;
		box-sizing: border-box;
		max-width: 100%;
	}

	:global(.cm-scroller) {
		overflow: auto;
	}

	:global(.cm-content) {
		padding: 16px;
		font-family: 'JetBrains Mono', monospace;
		line-height: 1.5;
	}

	.editor-card {
		height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
		background: var(--bg-card);
		color: var(--text-primary);
	}

	.card-header {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-bottom: 1px solid var(--border);
	}

	.test-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.test-controls label {
		margin: 0;
		white-space: nowrap;
		font-size: 0.875rem;
	}

	.editor-area {
		flex: 1;
		overflow: hidden;
		padding: 0.75rem;
		min-height: 0;
	}

	/*-- Desktop: show output as an overlay panel above the editor --*/
	.output-section {
		position: absolute;
		left: 16px;
		right: 16px;
		bottom: 16px;
		border: 1px solid var(--border);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		max-height: 60%;
		background: var(--bg-card);
		color: var(--text-primary);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		z-index: 60;
	}

	.output-header {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--bg-card);
	}

	.output-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		color: inherit;
	}

	.output-text {
		white-space: pre-wrap;
		word-break: break-word;
	}

	.distance-input {
		background-color: var(--bg-input);
		color: var(--text-primary);
		font-size: 0.875rem;
		width: 100px;
		height: 32px;
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 4px 8px;
		flex-shrink: 0;
	}

	.distance-input:focus {
		border: 2px solid var(--field-border) !important;
		box-shadow: 0 0 0 3px rgba(var(--field-border-rgb), 0.2) !important;
		outline: none !important;
	}

	.distance-input::placeholder {
		color: var(--text-muted);
		opacity: 1;
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

	.table-scroll {
		max-height: 200px;
		overflow-y: auto;
		border: 1px solid var(--border);
		border-radius: 6px;
	}

	.error {
		color: var(--danger);
	}

	/*-- Responsive styles for smaller screens --*/
	@media (max-width: 768px) {
		.test-controls {
			flex-wrap: nowrap;
			overflow-x: auto;
			padding-bottom: 4px;
		}

		.test-controls label {
			font-size: 0.8rem;
		}

		.distance-input {
			width: 80px;
			height: 30px;
			font-size: 0.8rem;
		}

		.btn-sm {
			padding: 0.25rem 0.5rem;
			font-size: 0.8rem;
		}

		.editor-area {
			padding: 0.5rem;
		}

		:global(.cm-editor) {
			font-size: 12px;
		}

		:global(.cm-content) {
			padding: 12px;
		}

		.output-content {
			padding: 0.75rem;
			font-size: 0.875rem;
		}

		.table {
			font-size: 0.8rem;
		}

		.table-scroll {
			max-height: 150px;
		}

		.card-header h5 {
			font-size: 1rem;
			margin-bottom: 0.5rem;
		}
	}

	@media (max-width: 576px) {
		.test-controls {
			gap: 0.25rem;
		}

		.distance-input {
			width: 70px;
		}

		.table {
			font-size: 0.75rem;
		}

		.output-section {
			max-height: 250px;
		}
	}

	@media (max-width: 343px) {
		.output-section {
			position: static;
			left: auto;
			right: auto;
			bottom: auto;
			box-shadow: none;
			border-radius: 0;
			border-top: 1px solid var(--border);
			max-height: 300px;
			margin-top: 0.5rem;
		}
	}
</style>
