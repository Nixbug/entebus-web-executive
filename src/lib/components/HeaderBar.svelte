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
		alert('Logout clicked'); // Replace with your actual logout logic
	}
</script>

<header class="app-header">
	<!-- Left -->
	<div class="d-flex align-items-center gap-2">
		<img src={enteBuslogo} alt="EnteBus" class="brand-logo" />
		<h5 class="mb-0 fw-bold app-title">EnteBus Executive</h5>
	</div>

	<!-- Right -->
	<div class="d-flex align-items-center gap-3">
		<!-- Theme toggle -->
		<button class="btn btn-sm theme-btn" on:click={toggleTheme} aria-label="Toggle theme">
			{#if dark}
				<i class="bi bi-sun text-warning fs-5"></i>
			{:else}
				<i class="bi bi-moon text-dark fs-5"></i>
			{/if}
		</button>

		<!-- Online badge -->
		<span class="badge rounded-pill d-flex align-items-center gap-2 px-3 py-1 status-chip">
			<i class="bi bi-circle-fill status-dot"></i>
			{text}
		</span>

		<!-- Avatar (desktop = dropdown, mobile = modal) -->
		<div class="dropdown d-none d-lg-block">
			<img
				src="https://i.pravatar.cc/40?u=john"
				alt="John"
				class="avatar"
				data-bs-toggle="dropdown"
			/>

			<ul
				class="dropdown-menu mt-3 dropdown-menu-end border-0 shadow-lg rounded-4 p-0"
				style="min-width: 260px;"
			>
				<li class="p-3 pb-2 text-center">
					<img src="https://i.pravatar.cc/64?u=john" alt="John" class="rounded-circle mb-2" />
					<h6 class="fw-bold mb-0">John Mathew</h6>
					<p class="small mb-0 text-muted">Executive Manager</p>
					<p class="small mb-0 text-muted">john@entebus.com</p>
				</li>
				<hr class="my-2" />
				<li class="px-3 pb-2">
					<a href="/user-profile" class="btn btn-light w-100 fw-medium border">Account Settings</a>
				</li>
				<li class="px-3 pb-3">
					<button class="btn btn-outline-danger w-100 fw-medium" on:click={handleLogout}>
						Logout
					</button>
				</li>
			</ul>
		</div>

		<!-- Mobile / Tablet avatar -->
		<div class="d-block d-lg-none">
			<img
				src="https://i.pravatar.cc/40?u=john"
				alt="John"
				class="avatar"
				on:click={toggleProfile}
			/>
		</div>
	</div>
</header>

<!-- Profile Modal for mobile/tablet -->
{#if showProfileModal}
	<div class="profile-modal" on:click={toggleProfile}>
		<div class="profile-content rounded-4 shadow p-4" on:click|stopPropagation>
			<div class="text-center border-bottom pb-3 mb-3">
				<img
					src="https://i.pravatar.cc/80?u=john"
					alt="John"
					class="rounded-circle mb-3 shadow-sm"
					width="80"
					height="80"
				/>
				<h6 class="fw-semibold mb-1">John Mathew</h6>
				<p class="small mb-0 text-muted">Executive Manager</p>
				<p class="small mb-0 text-muted">john@entebus.com</p>
			</div>

			<div class="d-flex flex-column gap-2 mb-3">
				<a href="/user-profile" class="btn btn-outline-primary fw-medium w-100">Account Settings</a>
				<button class="btn btn-danger fw-medium w-100" on:click={handleLogout}>Logout</button>
			</div>

			<button class="btn btn-light border w-100" on:click={toggleProfile}>Close</button>
		</div>
	</div>
{/if}

<style>
	.app-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--bg-card, #fff);
		color: var(--text-primary);
		padding: 0.75rem 2rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		height: 72px;
		box-sizing: border-box;
	}

	.brand-logo {
		width: 40px;
		height: 40px;
		background: #fff;
		border-radius: 50%;
		padding: 6px;
		object-fit: contain;
	}

	.app-title {
		font-size: 1.25rem;
		color: var(--text-primary);
	}

	.theme-btn {
		padding: 4px 6px !important;
		border: none !important;
		background: transparent !important;
	}

	.status-chip {
		background:var(--online-bg, #d1fae5);
		color:var(--online-fg, #d1fae5);
		font-size: 0.9rem;
		font-weight: 500;
		height: 32px;
		display: flex;
		align-items: center;
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

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid #fff;
		cursor: pointer;
	}

	/* Modal (tablet/mobile) */
	.profile-modal {
		position: fixed;
		inset: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(6px);
		z-index: 2000;
		animation: fadeIn 0.2s ease-in;
	}

	.profile-content {
		width: 90%;
		max-width: 340px;
		background: var(--bg-card, #fff);
		color: var(--text-primary, #000);
		border-radius: 1rem;
		animation: popIn 0.25s ease-out forwards;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes popIn {
		from { transform: scale(0.95); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	/* Responsive */
	@media (max-width: 460px) {
		.status-chip {
			display: none !important;
		}
		.app-header {
			padding: 0.75rem 1rem;
		}
	}

	@media (min-width: 1024px) {
		.app-header {
			padding: 0.75rem 4rem;
		}
	}
</style>
