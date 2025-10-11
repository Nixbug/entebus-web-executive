<script lang="ts">
	import entebusLogo from '$lib/assets/entebusLogo.png';
	let username: string = '';
	let password: string = '';
	let showPassword: boolean = false;

	function togglePassword() {
		showPassword = !showPassword;
	}

	function handleLogin() {
		alert('Login button clicked!');
		console.log('Username:', username);
		console.log('Password:', password);
	}
</script>

<div class="d-flex justify-content-center align-items-center vh-100 bg-light">
	<div class="card shadow-sm p-4 mx-3 mx-sm-0 w-100" style="max-width: 450px;">
		<div class="text-center mb-4">
			<img
				src={entebusLogo}
				alt="Entebus Logo"
				class="rounded-circle border border-2 border-primary p-1 shadow "
				style="width: 5rem; height: 5rem;"
			/>
			<h3 class="mt-2">Login</h3>
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
							class={showPassword ? 'bi bi-eye' : 'bi bi-eye-slash'}
							style="font-size: 1.25rem; color: rgb(9, 59, 133);"
						></i>
					</span>
				</div>
			</div>
			<!-- remember me checkbox -->
			<div class="mb-3 form-check">
				<input type="checkbox" class="form-check-input" id="rememberMe" />
				<label class="form-check-label" for="rememberMe">Remember Me</label>
			</div>
			<!-- login button -->
			<button type="submit" class="btn btn-primary mb-3 w-100">Login</button>
		</form>
	</div>
</div>
