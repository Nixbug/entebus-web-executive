<script lang="ts">
	import { onMount } from 'svelte';
	import { applyTheme } from '$lib/theme';
	import enteBuslogo from '$lib/assets/entebus_logo.png';
	import { DESKTOP_BREAKPOINT } from '$lib/constants';
	import { browser } from '$app/environment';
	import { getToken, logout } from '$lib/services/auth';
	import { Store } from '$lib/stores/session-store';

	let dark = false;
	export let text: string = 'Online';
	let showProfileModal = false;
	let dropdownOpen = false;
	let isDesktop = false;
	let showLogoutConfirm = false;
	let loggingOut = false;
	let username = 'Unknown user';
	let executiveId = '-';

	//-- Bind avatar button for focus restoration
	let avatarBtnEl: HTMLButtonElement | null = null;

	//-- Theme toggle logic --
	const toggleTheme = () => {
		dark = !dark;
		applyTheme(dark);
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	};

	function isDesktopScreen() {
		if (!browser) return false;
		return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches;
	}

	onMount(() => {
		const saved = localStorage.getItem('theme');
		dark = saved === 'dark';
		applyTheme(dark);

		const storedUsername = localStorage.getItem('username') || ((): string | null => {
			const s = Store.fetchData<any>('username');
			return typeof s === 'string' && s ? s : null;
		})();
		if (storedUsername) username = storedUsername;

		const token = getToken() as Record<string, unknown> | null;
		if (token && token.executive_id !== undefined && token.executive_id !== null) {
			executiveId = String(token.executive_id);
		}

		const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
		function updateDesktop() {
			isDesktop = isDesktopScreen();
			if (!isDesktop) dropdownOpen = false;
		}
		updateDesktop();
		mql.addEventListener('change', updateDesktop);
		return () => mql.removeEventListener('change', updateDesktop);
	});

	//-- Profile modal logic for mobile/tablet --
	const toggleProfile = () => {
		if (!browser) return;
		if (window.innerWidth <= DESKTOP_BREAKPOINT) {
			showProfileModal = !showProfileModal;
			document.body.style.overflow = showProfileModal ? 'hidden' : '';
		}
	};

	//-- Desktop dropdown toggle (pure Svelte)
	function toggleDesktopDropdown() {
		if (!isDesktop) return;
		dropdownOpen = !dropdownOpen;
	}

	function closeDesktopDropdown() {
		dropdownOpen = false;
		//-- return focus to avatar button for accessibility --
		avatarBtnEl?.focus();
	}

	function openLogoutConfirm() {
		dropdownOpen = false;
		showProfileModal = false;
		showLogoutConfirm = true;
		document.body.style.overflow = 'hidden';
	}

	function closeLogoutConfirm() {
		showLogoutConfirm = false;
		loggingOut = false;
		document.body.style.overflow = '';
	}

	//-- Logout with confirmation --
	async function handleLogout() {
		if (loggingOut) return;
		closeLogoutConfirm();
		loggingOut = true;
		await logout();
	}
</script>

<header class="app-header">
	<div class="container-xl d-flex align-items-center justify-content-between">
		<div class="d-flex align-items-center gap-2">
			<div class="brand-logo-wrapper">
				<img src={enteBuslogo} alt="EnteBus" />
			</div>

			<span class="mb-0 fw-inter-700 app-title rounded">EnteBus Executive</span>
		</div>
		<!-- Right -->
		<div class="d-flex align-items-center gap-3">
			<!-- Theme toggle -->
			<button
				class="btn btn-sm theme-btn theme-toggle"
				on:click={toggleTheme}
				aria-label="Toggle theme"
			>
				{#if dark}
					<i class="bi bi-sun text-light fs-6"></i>
				{:else}
					<i class="bi bi-moon text-dark fs-6"></i>
				{/if}
			</button>
			<!-- Online badge (desktop & tablet only) -->
			<span
				class="status-chip badge rounded-pill d-flex align-items-center fw-inter-500 gap-2 px-2 py-1 d-none d-md-flex"
				id="profile-menu"
				aria-labelledby="avatar-btn"
			>
				<i class="bi bi-circle-fill status-dot"></i>
				{text}
			</span>

			<!-- Desktop Avatar + Dropdown -->
			<!-- bind:this ensures dropdownEl is populated before onMount runs -->
			<div class="profile-dropdown d-none d-lg-block rounded-circle">
				<button
					id="avatar-btn"
					bind:this={avatarBtnEl}
					type="button"
					class="p-0 border-0 bg-transparent rounded-circle"
					aria-haspopup="true"
					aria-expanded={dropdownOpen ? 'true' : 'false'}
					style="line-height: 0;"
					on:click={toggleDesktopDropdown}
					on:keydown={(e) => {
						if (e.key === 'Escape') {
							e.preventDefault();
							closeDesktopDropdown();
						}
					}}
				>
					<img src="https://i.pravatar.cc/40?u=john" alt="John" class="avatar" />
				</button>

				{#if dropdownOpen && isDesktop}
					<ul
						class="dropdown-menu mt-4 dropdown-menu-end border-0 shadow-lg rounded-4 p-0 show"
						style="min-width: 260px;"
						role="menu"
						tabindex="0"
						aria-label="Profile menu"
						on:keydown={(e) => {
							if (e.key === 'Escape') {
								e.preventDefault();
								closeDesktopDropdown();
							}
						}}
					>
						<li class="p-3 pb-2 text-center">
							<img src="https://i.pravatar.cc/64?u=john" alt="John" class="rounded-circle mb-2" />
							<h6 class="fw-inter-700 mb-0">John Mathew</h6>
							<p class="small mb-0">Executive Manager</p>
							<p class="small mb-0">john@entebus.com</p>
						</li>
						<hr class="my-2" />
						<li class="px-3 pb-2">
							<a href="/user-profile" class="btn btn-light w-100 fw-medium border"
								>Account Settings</a
							>
						</li>
						<li class="px-3 pb-3">
							<button class="btn btn-outline-danger w-100 fw-medium" on:click={openLogoutConfirm}>
								Logout
							</button>
						</li>
					</ul>
				{/if}
			</div>

			<!-- Mobile / Tablet avatar -->
			<div class="d-block d-lg-none position-relative d-inline-block">
				<button
					type="button"
					class="avatar-btn p-0 border-0 bg-transparent"
					on:click={toggleProfile}
				>
					<img src="https://i.pravatar.cc/40?u=john" alt="John" class="avatar" />
				</button>
				<span
					class="position-absolute bottom-0 end-0 translate-middle-x online-dot-mobile d-md-none"
				></span>
			</div>
		</div>
	</div>
</header>

<!-- Desktop blur backdrop (excludes header) -->
{#if dropdownOpen && isDesktop}
	<button
		class="desktop-backdrop border-0 p-0 m-0"
		on:click={closeDesktopDropdown}
		aria-label="Close profile menu"
		title="Close profile menu"
	></button>
{/if}

<!-- Profile Modal for mobile/tablet -->
{#if showProfileModal}
	<div
		class="profile-modal"
		on:click={toggleProfile}
		role="button"
		tabindex="0"
		on:keydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				toggleProfile();
			}
		}}
	>
		<div class="profile-content rounded-4 shadow p-4" on:click|stopPropagation role="none">
			<div class="text-center border-bottom pb-3 mb-3">
				<img
					src="https://i.pravatar.cc/80?u=john"
					alt="John"
					class="rounded-circle mb-3 shadow-sm"
					width="80"
					height="80"
				/>
				<h6 class="fw-inter-700 mb-1">John Mathew</h6>
				<p class="small mb-0">Executive Manager</p>
				<p class="small mb-0">john@entebus.com</p>
			</div>

			<div class="d-flex flex-column gap-2 mb-3">
				<a href="/user-profile" class="btn btn-outline-primary fw-medium w-100">Account Settings</a>
				<button class="btn btn-danger fw-medium w-100" on:click={openLogoutConfirm}>Logout</button>
			</div>

			<button class="btn btn-light border w-100" on:click={toggleProfile}>Close</button>
		</div>
	</div>
{/if}

{#if showLogoutConfirm}
	<div
		class="logout-confirm-overlay"
		on:click={closeLogoutConfirm}
		role="presentation"
	>
		<div
			class="logout-confirm-card rounded-4 shadow"
			on:click|stopPropagation
			role="dialog"
			aria-modal="true"
			aria-labelledby="logout-confirm-title"
			tabindex="-1"
			on:keydown={(e) => {
				if (e.key === 'Escape') {
					e.preventDefault();
					closeLogoutConfirm();
				}
			}}
		>
			<div class="p-4 pb-2">
				<h5 id="logout-confirm-title" class="mb-2 fw-inter-700">Confirm Logout</h5>
				<p class="mb-3">Are you sure you want to logout from this account?</p>
				<div class="logout-user-meta rounded-3 px-3 py-2">
					<p class="mb-1"><strong>Username:</strong> {username}</p>
					<p class="mb-0"><strong>Executive ID:</strong> {executiveId}</p>
				</div>
			</div>
			<div class="d-flex gap-2 px-4 pb-4">
				<button
					class="btn btn-light border flex-fill"
					on:click={closeLogoutConfirm}
					disabled={loggingOut}>Cancel</button
				>
				<button class="btn btn-danger flex-fill" on:click={handleLogout} disabled={loggingOut}
					>{loggingOut ? 'Logging out...' : 'Yes, Logout'}</button
				>
			</div>
		</div>
	</div>
{/if}

<!-- Styles -->
<style>
	.app-header {
		background: var(--bg-card, #fff);
		color: var(--text-primary);
		height: 70px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		padding: 0.5rem 1rem;
		position: relative;
		z-index: 1060;
	}
	@media (min-width: 768px) {
		.app-header {
			padding: 1rem 1.5rem;
		}
	}

	.desktop-backdrop {
		position: fixed;
		top: 70px;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		z-index: 1040;
		animation: fadeIn 0.25s ease-out;
		cursor: pointer;
	}
	.dropdown-menu {
		z-index: 1050 !important;
		background: var(--bg-card, #fff);
		color: var(--text-primary, #000);
		position: absolute;
		right: 0;
		left: auto;
		max-width: 280px;
		min-width: 260px;
		inset-inline-end: 0;
		transform: translateY(0);
		max-height: 60vh;
		overflow-y: auto;
	}
	.dropdown-menu p {
		color: var(--text-muted, #6c757d);
	}

	.brand-logo-wrapper {
		width: 45px;
		height: 45px;
		background: #ffffff;
		border-radius: 50%;
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.brand-logo-wrapper img {
		width: 70%;
		height: auto;
		object-fit: contain;
	}

	.app-title {
		font-size: 1.5rem;
		color: var(--text-primary);
	}
	@media (max-width: 767px) {
		.app-title {
			font-size: 1.2rem;
		}
	}

	.status-chip {
		background: var(--online-bg, #d1fae5);
		color: var(--online-fg, #137333);
		height: 30px;
		border: var(--status-dot-active) 1.5px solid;
		font-size: 0.75rem;
	}
	.status-dot {
		font-size: 0.625rem;
		color: var(--status-dot-active);
		animation: pulse 1.8s ease-in-out infinite;
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.4;
			transform: scale(0.85);
		}
	}
	.online-dot-mobile {
		width: 12px;
		height: 12px;
		background-color: var(--status-dot-active);
		border: 2px solid var(--bg-card, #fff);
		border-radius: 50%;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
	}
	.theme-toggle {
		border-radius: 50%;
		border: none;
		background-color: transparent !important;
		transition: background-color 0.2s ease;
	}
	.theme-toggle:hover {
		background-color: var(--icon-hover-bg) !important;
	}
	.theme-toggle:focus {
		outline: none !important;
	}
	.theme-toggle:active {
		background-color: transparent !important;
	}

	.avatar {
		border-radius: 50%;
		border: 1px solid var(--border, #ccc);
		padding: 2px;
		cursor: pointer;
		width: 40px;
		height: 40px;
		object-fit: cover;
	}

	.profile-dropdown {
		position: relative;
	}

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
		max-width: 20rem;
		background: var(--bg-card, #fff);
		color: var(--text-primary, #000);
		border-radius: 1rem;
		animation: popIn 0.25s ease-out forwards;
	}

	.logout-confirm-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(5px);
		z-index: 2100;
		animation: fadeIn 0.2s ease-in;
	}

	.logout-confirm-card {
		width: min(92vw, 420px);
		background: var(--bg-card, #fff);
		color: var(--text-primary, #000);
	}

	.logout-user-meta {
		background: var(--icon-hover-bg);
		border: 1px solid var(--border, #ddd);
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
</style>
