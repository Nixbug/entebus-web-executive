<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { javascript } from '@codemirror/lang-javascript';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { keymap } from '@codemirror/view';
	import { indentWithTab } from '@codemirror/commands';

	export let value = '';
	export let theme: 'dark' | 'light' = 'dark';

	let editorContainer: HTMLDivElement;
	let view: EditorView | null = null;

	onMount(() => {
		const extensions = [
			basicSetup,
			keymap.of([indentWithTab]),
			javascript(),
			theme === 'dark' ? oneDark : [],
			EditorView.updateListener.of(update => {
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

	$: if (view && value !== view.state.doc.toString()) {
		view.dispatch({
			changes: {
				from: 0,
				to: view.state.doc.length,
				insert: value
			}
		});
	}

	onDestroy(() => {
		view?.destroy();
		view = null;
	});
</script>

<div bind:this={editorContainer} class="editor-root" > </div>

<style>
	.editor-root {
		width: 100%;
		height: 100%;
	}

	:global(.cm-editor) {
		height: 100%;
		min-height: 0;
		font-size: 13px;
		border-radius: 8px;
	}

	:global(.cm-scroller) {
		overflow: auto;
	}

	:global(.cm-content) {
		padding: 16px;
		font-family: 'JetBrains Mono', monospace;
		line-height: 1.5;
	}
</style>
