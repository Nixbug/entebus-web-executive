<script lang="ts">
	let count: number = 0;

	function increment() {
		count += 1;
	}
</script>

<div class="container mt-5">
	<h1 class="text-primary mb-4">Hi! Welcome to Svelte+Bootstrap</h1>

	<button class="btn btn-success mb-3" on:click={increment}> Click Me! </button>

	<p class="alert alert-info">Button clicked {count} {count === 1 ? 'time' : 'times'}</p>

	<div class="card mt-3" style="width: 18rem;">
		<div class="card-body">
			<h5 class="card-title">Bootstrap Card</h5>
			<p class="card-text">This is a simple card using Bootstrap styling.</p>
			<a href="#" class="btn btn-primary">Go somewhere</a>
		</div>
	</div>
</div>
