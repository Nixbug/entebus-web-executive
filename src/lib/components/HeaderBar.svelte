<script lang="ts">
	import { onMount } from 'svelte';
	import { applyTheme } from '$lib/theme';
	import enteBuslogo from '$lib/assets/enteBusLogo.svg';

	let dark = false;
	export let text: string = 'Online';

	const toggleTheme = () => {
		dark = !dark;
		applyTheme(dark);
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	};

	onMount(() => {
		const saved = localStorage.getItem('theme');
		dark = saved === 'dark';
		applyTheme(dark);
	});
</script>

<header
	class="d-flex align-items-center justify-content-between p-3 border-bottom"
	style="background:var(--bg-primary);color:var(--text-primary);"
>
	<!-- Logo + Title -->
	<div class="d-flex align-items-center gap-3">
		<img
			src={enteBuslogo}
			style="border-radius: 50%; background-color: #fff; padding: 8px;"
			alt="EnteBus"
			width="50"
			height="50"
		/>
		<h5 class="mb-0" style="font-size: 1.25rem; font-weight: 600;">EnteBus Executive</h5>
	</div>

	<!-- Right side -->
	<div class="d-flex align-items-center gap-3">
		<!-- Theme toggle -->
		<button class="btn btn-sm p-1" on:click={toggleTheme} aria-label="Toggle theme">
			{#if dark}
				<i class="bi bi-sun text-warning" style="font-size: 1.1rem;"></i>
			{:else}
				<i class="bi bi-moon text-dark" style="font-size: 1.1rem;"></i>
			{/if}
		</button>

		<!-- Online badge -->
<span
	class="badge rounded-pill d-flex align-items-center gap-2 px-3 py-1.5 status-chip"
>
	<i class="bi bi-circle-fill" style="font-size: 0.625rem;"></i>
	{text}
</span>
		<!-- Avatar with Custom Dropdown -->
		<div class="dropdown">
			<a
				href="#"
				class="d-block rounded-circle overflow-hidden border border-2 border-white shadow-sm"
				role="button"
				data-bs-toggle="dropdown"
				aria-expanded="false"
				style="width:40px; height:40px; line-height:0;"
			>
				<img
					src="https://i.pravatar.cc/40?u=john"
					alt="John"
					width="40"
					height="40"
					class="rounded-circle w-100 h-100 object-fit-cover"
				/>
			</a>

			<!-- Custom Dropdown Menu -->
			<div
				class="dropdown-menu dropdown-menu-end p-0 shadow-lg border-0"
				style="
					min-width: 260px;
					border-radius: 16px;
					overflow: hidden;
					margin-top: 12px !important;
					background: #ffffff;
				"
			>
				<!-- User Info Card -->
				<div class="p-3" style="background: #f8f9fa; border-bottom: 1px solid #e9ecef;">
					<div class="d-flex align-items-center gap-3">
						<img
							src="https://i.pravatar.cc/48?u=john"
							alt="John"
							width="48"
							height="48"
							class="rounded-circle flex-shrink-0"
						/>
						<div>
							<div class="fw-bold" style="font-size: 1rem; color: #212529;">John Mathew</div>
							<div class="text-muted" style="font-size: 0.875rem;">Executive Manager</div>
							<div class="text-muted small">john@entebus.com</div>
						</div>
					</div>
				</div>

				<!-- Menu Items -->
				<div class="py-1">
					<a
						href="/profile"
						class="dropdown-item d-flex align-items-center px-3 py-2"
						style="
							font-size: 0.9375rem;
							color: #495057;
							font-weight: 500;
						"
					>
						Account Settings
					</a>
				</div>

				<!-- Logout -->
				<div class="border-top" style="border-color: #e9ecef;">
					<a
						href="/logout"
						class="dropdown-item d-flex align-items-center px-3 py-2 text-danger"
						style="
							font-size: 0.9375rem;
							font-weight: 500;
						"
					>
						Logout
					</a>
				</div>
			</div>
		</div>
	</div>
</header>

<style>
.status-chip {
	background: var(--online-bg);
	color: var(--online-fg);
	font-size: 0.9375rem;
	font-weight: 500;
	min-height: 36px;
	border-radius: 9999px;
	display: inline-flex;
	align-items: center;
	border: 1px solid color-mix(in srgb, var(--online-fg) 50%, transparent);
	transition: background 0.3s ease, color 0.3s ease;
}


	/* Smooth shadow and elevation */
	.shadow-lg {
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.05) !important;
	}

	/* Hover effect on menu items */
	.dropdown-item:hover {
		background-color: #f1f3f5 !important;
	}


	/* Avatar border & shadow */
	.border-white {
		border-color: #ffffff !important;
	}
</style>