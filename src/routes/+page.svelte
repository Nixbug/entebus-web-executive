<script lang="ts">
	import entebusLogo from '$lib/assets/entebus_logo.png';
	import { API } from '$lib/api';
	import type { Activity, MaskedExecutiveToken, ExecutiveToken, LoginForm } from '$lib/types';
	import { URL_TOKEN } from '$lib/endpoints';
	import { goto } from '$app/navigation';
	import { Store } from '$lib/helpers';
	import { onMount } from 'svelte';
	import { loginSchema } from '$lib/schemas';
	import { writable } from 'svelte/store';
	import { toastStore } from '$lib/stores/toastStore';

	let rememberMe = $state(false);
	let showPassword: boolean = $state(false);
	let loginForm: LoginForm = $state({
		username: '',
		password: ''
	});
	let errors = writable<{ username?: string; password?: string }>({});

	let loginActivity: Activity = $state({
		is_disabled: false,
		error_message: '',
		in_progress: false
	});

	function togglePassword() {
		showPassword = !showPassword;
	}

	//--Executive Login --
	async function executiveLogin(event: SubmitEvent) {
		event.preventDefault();
		errors.set({});
		const result = loginSchema.safeParse(loginForm);
		if (!result.success) {
			const fieldErrors = result.error.flatten().fieldErrors;
			errors.set({
				username: fieldErrors.username?.[0],
				password: fieldErrors.password?.[0]
			});
			return;
		}
		try {
			const token = await API.createToken<LoginForm, ExecutiveToken>(
				URL_TOKEN,
				loginForm,
				loginActivity
			);
			const tokenString = JSON.stringify(token);
			if (rememberMe) {
				localStorage.setItem('token', tokenString);
			}
			Store.storeData<ExecutiveToken>('token', tokenString);
			toastStore.show('Login successful!', 'success');
			goto('/executive_account', { replaceState: true });
		} catch (error) {
			toastStore.show(loginActivity.error_message, 'error');
		}
	}

	//-- Executive token validation--
	async function validateToken() {
		try {
			const tokenString = localStorage.getItem('token');
			if (tokenString) {
				const token: MaskedExecutiveToken = JSON.parse(tokenString);
				Store.storeData<MaskedExecutiveToken>('token', tokenString);
				goto('/executive_account', { replaceState: true });
			}
		} catch (_) {
			loginActivity.error_message = '';
			localStorage.removeItem('token');
		}
	}

	onMount(() => {
		validateToken();
	});
</script>

<div class="d-flex justify-content-center align-items-center vh-100 bg-light">
	<div class="card shadow-sm p-4 mx-3 mx-sm-0 w-100" style="max-width: 30rem;">
		<div class="text-center mb-4">
			<img
				src={entebusLogo}
				alt="Entebus Logo"
				class="rounded-circle border border-2 border-primary p-1 shadow"
				style="width: 5rem; height: 5rem;"
			/>
			<h3 class="mt-2">Login</h3>
		</div>

		<form onsubmit={executiveLogin}>
			<!-- username field -->
			<div class="mb-3">
				<label for="username" class="form-label">Username</label>
				<input
					type="text"
					class="form-control form-control-lg"
					id="username"
					bind:value={loginForm.username}
					placeholder="username"
				/>
				{#if $errors.username}
					<div class="text-danger mt-1">{$errors.username}</div>
				{/if}
			</div>
			<!--password field -->
			<div class="mb-3">
				<label for="password" class="form-label">Password</label>
				<div class="input-group">
					<input
						type={showPassword ? 'text' : 'password'}
						class="form-control form-control-lg"
						id="password"
						bind:value={loginForm.password}
						placeholder="password"
					/>
					<span
						class="input-group-text bg-white border-1"
						role="button"
						tabindex="0"
						onclick={togglePassword}
						onkeydown={(e) => e.key === 'Enter' && togglePassword()}
						aria-label="Toggle password visibility"
						aria-pressed={showPassword}
						style="cursor: pointer;"
					>
						<i
							class={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'} text-primary`}
							style="font-size: 1.25rem;"
						></i>
					</span>
				</div>
				{#if $errors.password}
					<div class="text-danger mt-1">{$errors.password}</div>
				{/if}
			</div>
			<!-- remember me checkbox -->
			<div class="mb-3 form-check">
				<input
					type="checkbox"
					bind:checked={rememberMe}
					class="form-check-input"
					id="remember-me"
				/>
				<label class="form-check-label" for="rememberMe">Remember Me</label>
			</div>
			<!-- login button -->
			<button type="submit" class="btn btn-primary mb-3 w-100">
				{#if loginActivity.in_progress}
					<div class="spinner-border spinner-border-sm"></div>
				{:else}
					Login
				{/if}
			</button
			>
		</form>
		<p
			class="text-danger m-0"
			id="error-message"
			style="min-height: 1.5rem; visibility: {loginActivity.error_message ? 'visible' : 'hidden'};"
		>
			{loginActivity.error_message}
		</p>
	</div>
</div>
