<script lang="ts">
	import { API } from '$lib/api';
	import type {
		Activity,
		MaskedExecutiveToken,
		ExecutiveToken,
		LoginForm,
		ExecutiveRole,
		ExecutiveMapping
	} from '$lib/types';
	import { URL_TOKEN, URL_ROLE_MAPPING, URL_ROLE } from '$lib/endpoints';
	import { goto } from '$app/navigation';
	import { Store } from '$lib/helpers';
	import { onMount } from 'svelte';
	import { loginSchema } from '$lib/schemas';
	import { writable } from 'svelte/store';
	import { toastStore } from '$lib/stores/toastStore';
    
	let rememberMe = $state(false);
	let showPassword: boolean = $state(false);
	function togglePassword() {
		showPassword = !showPassword;
	}

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

	async function ExecutiveLogin() {
	// Clear previous errors
	errors.set({});

	const result = loginSchema.safeParse(loginForm);

	if (!result.success) {
		// Use flatten() to get field-specific errors
		const fieldErrors = result.error.flatten().fieldErrors;
		errors.set({
			username: fieldErrors.username?.[0],
			password: fieldErrors.password?.[0]
		});
		return;
	}
		try {
			// Login with credentials
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
			// Fetch the role
			const searchFilter = { executive_id: token.executive_id };
			const roleMappings = await API.fetchObjects<ExecutiveMapping>(
				URL_ROLE_MAPPING,
				token,
				searchFilter,
				loginActivity
			);
			console.log('====================================');
			console.log(roleMappings);
			console.log('====================================');
			if (roleMappings.length > 0) {
				const searchFilter = { id: roleMappings[0].role_id };
				const roles = await API.fetchObjects<ExecutiveRole>(
					URL_ROLE,
					token,
					searchFilter,
					loginActivity
				);

				let roleString = JSON.stringify(roles[0]);
				localStorage.setItem('role', roleString);
				Store.storeData<ExecutiveRole>('role', roleString);
			} else {
				const role: ExecutiveRole = {
					id: 0,
					name: '',
					manage_ex_token: false,
					manage_op_token: false,
					manage_ve_token: false,
					create_executive: false,
					update_executive: false,
					delete_executive: false,
					create_landmark: false,
					update_landmark: false,
					delete_landmark: false,
					create_company: false,
					update_company: false,
					delete_company: false,
					create_operator: false,
					update_operator: false,
					delete_operator: false,
					create_business: false,
					update_business: false,
					delete_business: false,
					create_route: false,
					update_route: false,
					delete_route: false,
					create_bus: false,
					update_bus: false,
					delete_bus: false,
					create_vendor: false,
					update_vendor: false,
					delete_vendor: false,
					create_schedule: false,
					update_schedule: false,
					delete_schedule: false,
					create_service: false,
					update_service: false,
					delete_service: false,
					create_fare: false,
					update_fare: false,
					delete_fare: false,
					create_duty: false,
					update_duty: false,
					delete_duty: false,
					create_ex_role: false,
					update_ex_role: false,
					delete_ex_role: false,
					create_op_role: false,
					update_op_role: false,
					delete_op_role: false,
					create_ve_role: false,
					update_ve_role: false,
					delete_ve_role: false
				};

				let roleString = JSON.stringify(role);
				localStorage.setItem('role', roleString);
				Store.storeData<ExecutiveRole>('role', roleString);
			}
            toastStore.show('Login successful!', 'success');
			goto('/executive_account', { replaceState: true });
		} catch (_) {}
	}
	async function validateToken() {
		try {
			const tokenString = localStorage.getItem('token');
			const roleString = localStorage.getItem('role');
			if (tokenString && roleString) {
				const token: MaskedExecutiveToken = JSON.parse(tokenString);
				console.log('====================================');
				console.log(token);
				console.log('====================================');
				const searchFilter = { id: token.id };
				await API.fetchObjects<MaskedExecutiveToken>(URL_TOKEN, token, searchFilter, loginActivity);

				Store.storeData<MaskedExecutiveToken>('token', tokenString);
				Store.storeData<ExecutiveRole>('role', roleString);
				goto('/executive_account', { replaceState: true });
			}
		} catch (_) {
			loginActivity.error_message = '';
			localStorage.removeItem('token');
			localStorage.removeItem('role');
		}
	}

	onMount(() => {
		validateToken();
	});
</script>

<div class="d-flex justify-content-center align-items-center vh-100 bg-light">
	<div class="card shadow-sm p-4 mx-3 mx-sm-0">
		<div class="text-center mb-4">
			<i class="bi bi-person-circle style-person-icon" style=""></i>
			<h3 class="mt-2">Login</h3>
		</div>

		<form onsubmit={ExecutiveLogin}>
			<div class="mb-3">
	<label for="username" class="form-label">Username</label>
	<input
		type="text"
		class="form-control"
		id="username"
		bind:value={loginForm.username}
		placeholder="Enter username"
	/>
	{#if $errors.username}
		<div class="text-danger mt-1">{$errors.username}</div>
	{/if}
</div>

			<div class="mb-3">
	<label for="password" class="form-label">Password</label>
	<div class="input-group">
		<input
			type={showPassword ? 'text' : 'password'}
			class="form-control"
			id="password"
			bind:value={loginForm.password}
			placeholder="Enter password"
		/>
		<span
			class="input-group-text"
			role="button"
			tabindex="0"
			onclick={togglePassword}
			onkeydown={(e) => e.key === 'Enter' && togglePassword()}
			aria-label="Toggle password visibility"
		>
			<i class={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
		</span>
	</div>
	{#if $errors.password}
		<div class="text-danger mt-1">{$errors.password}</div>
	{/if}
</div>

			<div class="mb-3 form-check">
        <input bind:checked={rememberMe} type="checkbox" class="form-check-input" id="rememberMe" />
        <label class="form-check-label" for="rememberMe">Remember Me</label>
        </div>

			<button type="submit" class="btn mb-3 w-100">{#if loginActivity.in_progress}
					<div class="spinner-border spinner-border-sm"></div>
				{:else}
					Login
				{/if}</button>
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
