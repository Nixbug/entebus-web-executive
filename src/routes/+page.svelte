<script lang="ts">
	import entebusLogo from '$lib/assets/entebus_logo.png';
	import { goto } from '$app/navigation';
	let username: string = '';
	let password: string = '';
	let showPassword: boolean = false;

	function togglePassword() {
		showPassword = !showPassword;
	}

	//-- Login handler (mock) --
	function handleLogin() {
		goto('/dashboard');
		alert('Login successful!');
		console.log('Username:', username);
		console.log('Password:', password);
	}
</script>

<div class="container mt-5">
  <h1 class="text-primary mb-4">svelet+Bootstrap Test Component</h1>

  <button class="btn btn-success mb-3" on:click={increment}>
    Click Me!
  </button>

  <p class="alert alert-info">Button clicked {count} {count === 1 ? 'time' : 'times'}</p>

  <div class="card mt-3" style="width: 18rem;">
    <div class="card-body">
      <h5 class="card-title">Bootstrap Card</h5>
      <p class="card-text">This is a simple card using Bootstrap styling.</p>
      <a href="#" class="btn btn-primary">Go somewhere</a>
    </div>
  </div>
</div>

<!-- style -->
<style>
	.login-bg {
		background: radial-gradient(rgba(4, 70, 105, 0.293), rgba(255, 255, 255, 1) 60%);
	}
	.eye-color {
		color: #47c7ff;
	}
	.sign-in-btn {
		background: linear-gradient(90deg, #2033b1 0%, #47c7ff 50%, #10c555 100%);
		border: none;
		border-radius: 8px;
		padding: 12px;
	}
	.sign-in-btn:hover {
		box-shadow: 0 8px 24px rgba(14, 201, 167, 0.35);
	}
</style>
