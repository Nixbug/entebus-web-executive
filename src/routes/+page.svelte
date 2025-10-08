<script lang="ts">
	let username: string = '';
	let password: string = '';
	let showPassword: boolean = false;

	function togglePassword() {
		showPassword = !showPassword;
	}
</script>

<div class="d-flex justify-content-center align-items-center vh-100 bg-light">
	<div class="card shadow-sm p-4 mx-3 mx-sm-0">
		<div class="text-center mb-4">
			<i class="bi bi-person-circle style-person-icon" style=""></i>
			<h3 class="mt-2">Login</h3>
		</div>

		<form>
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
						class="input-group-text"
						role="button"
						tabindex="0"
						on:click={togglePassword}
						on:keydown={(e) => e.key === 'Enter' && togglePassword()}
						aria-label="Toggle password visibility"
					>
						<i class={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
					</span>
				</div>
			</div>

			<button type="submit" class="btn w-100">Login</button>
		</form>

		<p class="text-center mt-3 mb-0">
			<a href="#">Forgot password?</a>
		</p>
	</div>
</div>

<style>
	.style-person-icon {
		font-size: 5rem;
		color: rgb(9, 59, 133);
	}
	.card {
		max-width: 450px;
		width: 100%;
	}

	.btn {
		color: white;
		background-color: rgb(9, 59, 133);
	}
	.input-group-text {
		cursor: pointer;
	}
	.input-group-text:hover i {
		color: rgb(9, 59, 133);
	}
</style>
