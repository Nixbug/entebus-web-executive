<script lang="ts">
	let username: string = '';
	let password: string = '';
	let showPassword: boolean = false;

	//--------------- toggle password visibility ---------------
	function togglePassword() {
		showPassword = !showPassword;
	}
</script>

<div class="d-flex justify-content-center align-items-center vh-100 bg-light">
	<div class="card shadow-sm p-4 mx-3 mx-sm-0 w-100" style="max-width: 450px;">
		<div class="text-center mb-4">
			<i class="bi bi-person-circle text-primary style-person-icon" style="font-size: 5rem;"></i>
			<h3 class="mt-2">Login</h3>
		</div>

		<form>
			<!--------------- username field --------------->
			<div class="mb-3">
				<label for="username" class="form-label">Username</label>
				<input
					type="text"
					class="form-control"
					id="username"
					placeholder="Enter username"
					required
				/>
			</div>
			<!--------------- password field --------------->
			<div class="mb-3">
				<label for="password" class="form-label">Password</label>
				<div class="input-group">
					<input
						type={showPassword ? 'text' : 'password'}
						class="form-control"
						id="password"
						placeholder="Enter password"
						required
					/>

					<span
						class="input-group-text bg-white border-1"
						role="button"
						tabindex="0"
						on:click={togglePassword}
						on:keydown={(e) => e.key === 'Enter' && togglePassword()}
						aria-label="Toggle password visibility"
						style="cursor: pointer;"
					>
						<i
							class={showPassword ? 'bi bi-eye' : 'bi bi-eye-slash'}
							style="font-size: 1.25rem; color: rgb(9, 59, 133);"
						></i>
					</span>
				</div>
			</div>
			<!--------------- remember me checkbox --------------->
			<div class="mb-3 form-check">
				<input type="checkbox" class="form-check-input" id="rememberMe" />
				<label class="form-check-label" for="rememberMe">Remember Me</label>
			</div>
			<!--------------- login button --------------->
			<button type="submit" class="btn btn-primary mb-3 w-100">Login</button>
		</form>
	</div>
</div>
