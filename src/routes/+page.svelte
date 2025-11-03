<script lang="ts">
	import entebusLogo from '$lib/assets/entebus_logo.png';
	import { goto } from '$app/navigation';
	let username: string = '';
	let password: string = '';
	let showPassword: boolean = false;

	function togglePassword() {
		showPassword = !showPassword;
	}

	function handleLogin() {
		goto('/executive-account');
		alert('Login successful!');
		console.log('Username:', username);
		console.log('Password:', password);
	}
</script>

<div class="d-flex justify-content-center align-items-center vh-100 bg-light login-bg">
	<div class="card login-card shadow-sm p-4 mx-3 mx-sm-0 w-100" style="max-width: 30rem;">
		<div class="text-center mb-4">
			<img src={entebusLogo} alt="Entebus Logo" style="width: 5rem; height: 5rem;" />
			<h3 class="mt-2 fw-inter-700">Executive Sign In</h3>
			<h6 class="text-secondary fw-inter-400">Access your Entebus Executive dashboard</h6>
		</div>
		<form on:submit|preventDefault={handleLogin}>
			<!-- username field -->
			<div class="mb-3">
				<label for="username" class="form-label">Username</label>
				<input
					type="text"
					class="form-control form-control-lg"
					id="username"
					bind:value={username}
					placeholder="username"
					required
				/>
			</div>
			<!--password field -->
			<div class="mb-3">
				<label for="password" class="form-label">Password</label>
				<div class="input-group">
					<input
						type={showPassword ? 'text' : 'password'}
						class="form-control form-control-lg"
						id="password"
						bind:value={password}
						placeholder="password"
						required
					/>
					<span
						class="input-group-text bg-white border-1"
						role="button"
						tabindex="0"
						on:click={togglePassword}
						on:keydown={(e) => e.key === 'Enter' && togglePassword()}
						aria-label="Toggle password visibility"
						aria-pressed={showPassword}
						style="cursor: pointer;"
					>
						<i
							class={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash '} eye-color`}
							style="font-size: 1.25rem;"
						></i>
					</span>
				</div>
			</div>
			<!-- remember me checkbox -->
			<div class="mb-3 form-check">
				<input type="checkbox" class="form-check-input" id="remember-me" />
				<label class="form-check-label text-secondary" for="rememberMe">Remember Me</label>
			</div>
			<!-- login button -->
			<button type="submit" style="color: white;" class="btn sign-in-btn mb-3 w-100 fw-bold"
				>Sign in</button
			>
		</form>
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
