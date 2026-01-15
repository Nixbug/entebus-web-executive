<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	export let value = '';
	export let language = 'javascript';
	export let theme = 'vs-dark';
	export let height = '70vh';
	let editorContainer: HTMLDivElement;
	let editor: any;
	let monaco: any;
	const dispatch = createEventDispatcher();

	onMount(async () => {
		monaco = await import('monaco-editor');
		editor = monaco.editor.create(editorContainer, {
			value,
			language,
			theme,
			automaticLayout: true,
			minimap: { enabled: false },
			fontSize: 14
		});
		editor.onDidChangeModelContent(() => {
			value = editor.getValue();
			dispatch('input', value);
		});
	});

	$: if (editor && value !== editor.getValue()) {
		editor.setValue(value);
	}

	onDestroy(() => {
		if (editor) editor.dispose();
	});
</script>

<div
	bind:this={editorContainer}
	style="width:100%;height:{height};border-radius:12px;overflow:hidden;"
></div>
