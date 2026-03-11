<script lang="ts">
	import entebusLogo from '$lib/assets/entebus_logo.png';
	import { goto } from '$app/navigation';
	import { executiveLogin, validateToken, getClientDetails, storeToken, scheduleTokenRefresh } from '$lib/services/auth';
	import { handleApiError } from '$lib/utils/api-error';
	import { loginSchema } from '$lib/schemas';
	import toast from '$lib/utils/toast';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';

	let username: string = '';
	let password: string = '';
	let loading = false;
	let error = '';
	let showPassword: boolean = false;
	let rememberMe: boolean = false;
	let checkingToken = true;
	const fieldErrors = writable<{ username?: string; password?: string }>({});
	const clientDetails = getClientDetails();

	//-- Toggle password visibility --
	function togglePassword() {
		showPassword = !showPassword;
	}

	//-- Handle login --
	const handleLogin = async () => {
		loading = true;
		error = '';
		//-- Reset field errors --
		fieldErrors.set({ username: '', password: '' });
		//-- Validate with Zod --
		const result = loginSchema.safeParse({ username, password });
		if (!result.success) {
			//-- Extract errors --
			const formatted = result.error.format();
			fieldErrors.set({
				username: formatted.username?._errors[0] || '',
				password: formatted.password?._errors[0] || ''
			});
			loading = false;
			return;
		}
		try {
			const token = await executiveLogin(username, password, JSON.stringify(clientDetails));
			storeToken(token, rememberMe);
			scheduleTokenRefresh(token);
			toast.success('User login successful!');
			goto('/dashboard');
		} catch (err: any) {
			error = await handleApiError(err);
			toast.error(error);
		} finally {
			loading = false;
		}
	};

	//-- Validate token on mount --
	onMount(async () => {
		await validateToken();
		checkingToken = false;
	});
</script>

<div class="d-flex justify-content-center align-items-center vh-100 bg-light login-bg">
	{#if checkingToken}
		<div class="spinner-border text-primary" role="status">
			<span class="visually-hidden">Loading...</span>
		</div>
	{:else}
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
						disabled={loading}
						on:input={() => fieldErrors.update((s) => ({ ...(s || {}), username: '' }))}
					/>
					<!-- field error display -->
					{#if $fieldErrors.username}
						<div class="invalid-feedback d-block">{$fieldErrors.username}</div>
					{/if}
				</div>

				<!-- password field -->
				<label for="password" class="form-label">Password</label>
				<div class="input-group">
					<input
						type={showPassword ? 'text' : 'password'}
						class="form-control form-control-lg"
						id="password"
						bind:value={password}
						placeholder="password"
						disabled={loading}
						on:input={() => fieldErrors.update((s) => ({ ...(s || {}), password: '' }))}
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
						<i class={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'} eye-color`}></i>
					</span>
				</div>
				{#if $fieldErrors.password}
					<div class="invalid-feedback d-block">{$fieldErrors.password}</div>
				{/if}
				<!-- remember me checkbox -->
				<div class="mb-3 form-check">
					<input
						type="checkbox"
						class="form-check-input"
						id="remember-me"
						bind:checked={rememberMe}
						disabled={loading}
					/>
					<label class="form-check-label text-secondary" for="remember-me">Remember Me</label>
				</div>
				<!-- login button -->
				<button
					type="submit"
					style="color: white;"
					disabled={loading}
					class="btn sign-in-btn mb-3 w-100 fw-inter-700"
					>{loading ? 'Signing in...' : 'Sign in'}</button
				>
			</form>
		</div>
	{/if}
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
