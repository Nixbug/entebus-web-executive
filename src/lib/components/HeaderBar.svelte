<script lang="ts">
	import { onMount } from 'svelte';
	import { applyTheme } from '$lib/theme';
	import enteBuslogo from '$lib/assets/entebus_logo.png';

	let dark = false;
	export let text: string = 'Online';
	let showProfileModal = false;

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

	const toggleProfile = () => {
		if (window.innerWidth <= 1024) {
			showProfileModal = !showProfileModal;
			document.body.style.overflow = showProfileModal ? 'hidden' : '';
		}
	};
	function handleLogout() {
		alert('Logout clicked'); // Add your logout logic here
	}
</script>

<header
	class="d-flex align-items-center justify-content-md-between justify-content-between flex-wrap px-4 py-3 border-bottom"
	style="background: var(--bg-card); color: var(--text-primary);"
>
	<!-- Left side -->
	<div class="d-flex align-items-center gap-2">
		<img
			src={enteBuslogo}
			class="rounded-circle bg-white p-2"
			alt="EnteBus"
			width="35"
			height="35"
		/>
		<h5 class="mb-0 fw-semibold app-title">EnteBus Executive</h5>
	</div>

	<!-- Right side -->
	<div class="d-flex align-items-center gap-2 mt-1 mt-md-0 flex-shrink-0">
		<!-- Theme toggle -->
		<button class="btn btn-sm p-1" on:click={toggleTheme} aria-label="Toggle theme">
			{#if dark}
				<i class="bi bi-sun text-warning fs-5"></i>
			{:else}
				<i class="bi bi-moon text-dark fs-5"></i>
			{/if}
		</button>

		<!-- Online badge -->
<span class="badge rounded-pill d-flex align-items-center gap-2 px-2 py-1 status-chip">
	<i class="bi bi-circle-fill status-dot"></i>
	{text}
</span>

		<!-- Avatar desktop -->
		<div class="dropdown d-none d-lg-block">
			
				<img
					src="https://i.pravatar.cc/40?u=john"
					alt="John"
					class="w-100 h-100 rounded-circle object-fit-cover"
				data-bs-toggle="dropdown"
				/>

			<ul
				class="dropdown-menu mt-4 dropdown-menu-end border-0 shadow-lg rounded-4 p-0"
				style="min-width: 260px; background: #fff;"
			>
				<!-- User info -->
				<li class="p-3 pb-2 text-center">
					<img
						src="https://i.pravatar.cc/64?u=john"
						alt="John"
						class="rounded-circle mb-2"
						width="64"
						height="64"
					/>
					<h6 class="fw-bold mb-0" style="color: var(--text-primary)">John Mathew</h6>
					<p class="small mb-0" style="color: var(--text-muted)">Executive Manager</p>
					<p class="small mb-0" style="color: var(--text-muted)">john@entebus.com</p>
				</li>

				<hr class="my-2 border-light" />

				<!-- Account Settings -->
				<li class="px-3 pb-2">
					<a
						href="/user-profile"
						class="btn btn-light w-100 fw-medium border text-dark account-btn"
					>
						Account Settings
					</a>
				</li>

				<!-- Logout -->
				<li class="px-3 pb-3">
					<button
						class="btn btn-outline-danger w-100 fw-medium logout-btn"
						aria-label="logout-button"
						on:click={handleLogout}
					>
						Logout
					</button>
				</li>
			</ul>
		</div>

		<!-- Avatar for tablet/mobile -->
		<div class="d-block d-lg-none">
			<img
				src="https://i.pravatar.cc/40?u=john"
				alt="John"
				width="40"
				height="40"
				class="rounded-circle border border-2 border-white shadow-sm"
				style="cursor: pointer;"
				on:click={toggleProfile}
			/>
		</div>
	</div>
</header>

{#if showProfileModal}
	<div class="profile-modal" on:click={() => toggleProfile()}>
		<div
			class="profile-content rounded-4 shadow p-4"
			style="max-width: 340px;"
			on:click|stopPropagation
		>
			<div class="text-center border-bottom pb-3 mb-4">
				<img
					src="https://i.pravatar.cc/80?u=john"
					alt="John"
					class="rounded-circle mb-3 shadow-sm"
					width="80"
					height="80"
				/>
				<h6 class="fw-semibold mb-1" style="color: var(--text-primary)">
					John Mathew
				</h6>
				<p class="small mb-0" style="color: var(--text-muted)">
					Executive Manager
				</p>
				<p class="small mb-0" style="color: var(--text-muted)">
					john@entebus.com
				</p>
			</div>

			<div class="d-flex flex-column gap-2 mb-3">
				<a
					href="/user-profile"
					class="btn btn-outline-primary fw-medium w-100"
					>Account Settings</a
				>
				<button
					class="btn btn-danger fw-medium w-100"
					on:click={handleLogout}
				>
					Logout
				</button>
			</div>

			<button
				class="btn btn-light border w-100"
				on:click={() => toggleProfile()}
			>
				Close
			</button>
		</div>
	</div>
{/if}



<style>
	.profile-modal {
		position: fixed;
		inset: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(6px);
		z-index: 2000;
		animation: fadeIn 0.2s ease-in;
	}

	.profile-content {
		width: 90%;
		background: var(--bg-card, #fff);
		color: var(--text-primary, #000);
		border-radius: 1rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		transform: scale(0.95);
		animation: popIn 0.25s ease-out forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes popIn {
		from {
			transform: scale(0.95);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	.status-chip {
		background: var(--online-bg);
		color: var(--online-fg);
		font-size: 0.9rem;
		font-weight: 500;
		border: 1px solid color-mix(in srgb, var(--online-fg) 50%, transparent);
		padding:1rem;
	}

	.status-dot {
		font-size: 0.625rem;
		color: #22c55e;
		animation: pulse 1.8s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.4;
			transform: scale(0.85);
		}
	}

	/* Reduce left text + right section on smaller devices */
	.app-title {
		font-size: 1.25rem;
	}

	@media (max-width: 1024px) {
		.app-title {
			font-size: 1.1rem;
		}
		.status-chip {
			font-size: 0.85rem;
			padding: 0.25rem 0.6rem;
		}
		.btn i {
			font-size: 1rem !important;
		}
	}
	.dropdown-menu {
		background-color: var(--bg-card) !important;
		color: var(--text-primary) !important;
		border-color: var(--border) !important;
		backdrop-filter: blur(12px);
	}

	/* Optional: subtle border and shadow */
	.dropdown-menu {
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
	}
	.account-btn {
		border-color: #dee2e6 !important;
		background: #fff !important;
		transition: all 0.2s ease-in-out;
	}
	.account-btn:hover {
		background: #f8f9fa !important;
	}

	.logout-btn {
		border-width: 1.5px !important;
		transition: all 0.2s ease-in-out;
	}
	.logout-btn:hover {
		background: #dc3545 !important;
		color: #fff !important;
	}

	.dropdown-menu li {
		text-align: center;
	}

	hr {
		border-top: 1px solid #f1f1f1 !important;
		margin: 0.75rem 0 !important;
	}
	@media (max-width: 768px) {
		.app-title {
			font-size: 1rem;
		}
		header {
			padding: 0.5rem 1rem !important;
		}
		.status-chip {
			font-size: 0.8rem;
		}
	}

	@media (max-width: 480px) {
		.app-title {
			font-size: 0.9rem;
		}
	}

	/* Modal overlay for small screens */
	.profile-modal {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(6px);
		z-index: 2000;
		animation: fadeIn 0.2s ease-in;
	}
	.profile-content {
		background: var(--bg-card);
		color: var(--text-primary);
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
