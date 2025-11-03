<script>
	import entebusLogo from '$lib/assets/entebus_logo.png';
	import { page } from '$app/stores';
	let sidebarOpen = false;

	const executiveLinks = [
		{ href: '/executive-account', icon: 'bi-person', label: 'Account' },
		{ href: '/executive-role', icon: 'bi-person-gear', label: 'Role' },
		{ href: '/landmark', icon: 'bi-geo-alt', label: 'Landmark' },
		{ href: '/global-fare', icon: 'bi-currency-rupee', label: 'Global Fare' }
	];
	function logout() {
		alert('Logging out...');
	}
</script>

<!-- overlay for mobile when sidebar is open -->
{#if sidebarOpen}
	<button
		type="button"
		class="overlay d-desktop-none"
		aria-label="Close sidebar"
		on:click={() => (sidebarOpen = false)}
	></button>
{/if}

<!-- Hamburger Button (only visible on small screens) -->
<div class="mobile-header d-flex align-items-center justify-content-center px-3 py-2 d-md-none">
	<!-- Left-aligned toggle button -->
	<button
		class="btn p-0 position-absolute start-0 ms-3"
		on:click={() => (sidebarOpen = !sidebarOpen)}
		aria-label="Toggle sidebar"
	>
		<i class="bi bi-list fs-4 text-white"></i>
	</button>

	<!-- Centered logo + title -->
	<div class="d-flex align-items-center">
		<img src={entebusLogo} alt="Logo" class="logo me-2" />
		<h5 class="mb-0 text-white fw-inter-700">EnteBus</h5>
	</div>
</div>

<!-- Sidebar -->
<div class="sidebar vh-100 p-3 d-flex flex-column" class:show={sidebarOpen}>
	<!-- Logo Section -->
	<div class="logo-container d-flex align-items-center gap-4">
		<img src={entebusLogo} style="width: 45px; height: 45px;" alt="EnteBus Logo" />
		<h5 class="m-0 fw-inter-700">EnteBus</h5>
		<!-- Close Icon (visible only on mobile) -->
		<button
			class="btn btn-sm d-desktop-none align-self-end mb-2"
			on:click={() => (sidebarOpen = false)}
			aria-label="Close sidebar"
		>
			<i class="bi bi-x-lg" style="color: #fff;"></i>
		</button>
	</div>
	<hr />
	<!-- Navigation -->
	<p class="nav-section mt-2 fw-inter-500">EXECUTIVES</p>
	<ul class="nav flex-column">
		{#each executiveLinks as link}
			<li>
				<a href={link.href} class="nav-link" class:active={$page.url.pathname === link.href}>
					<i class="{link.icon} fs-5"></i>
					{link.label}
				</a>
			</li>
		{/each}
	</ul>
	<!-- Footer -->
	<div class="footer mt-auto text-light">
		<hr />
		<!-- Collapsible User Section -->
		<div class="accordion" id="userAccordion">
			<div class="accordion-item bg-transparent border-0">
				<h2 class="accordion-header">
					<button
						class="accordion-button fw-inter-600 collapsed bg-transparent text-light d-flex align-items-center justify-content-between"
						type="button"
						data-bs-toggle="collapse"
						data-bs-target="#userCollapse"
						aria-expanded="false"
					>
						<div class="d-flex align-items-center gap-2">
							<div
								class="footer-icon p-2 rounded-circle d-flex align-items-center justify-content-center"
							>
								<i class="bi bi-person-circle fs-5 text-light"></i>
							</div>
							<span>User</span>
						</div>
						<i class="bi bi-chevron-down ms-auto toggle-arrow"></i>
					</button>
				</h2>

				<div id="userCollapse" class="accordion-collapse collapse" data-bs-parent="#userAccordion">
					<div class="accordion-body p-0">
						<div class="user-menu d-flex flex-column px-3 pb-3 gap-2">
							<button
								type="button"
								class="btn btn-sm w-100 d-flex align-items-center text-light gap-2 py-1 px-2 rounded-2 bg-transparent border-0"
							>
								<i class="bi bi-person text-success fs-5"></i>
								<span>My Profile</span>
							</button>

							<button
								type="button"
								class="btn btn-sm w-100 d-none d-md-flex align-items-center text-light gap-2 py-1 px-2 rounded-2 bg-transparent border-0"
								on:click={logout}
							>
								<i class="bi bi-power text-danger fs-5"></i>
								<span>Logout</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
		<p class="footer-text m-0 fw-inter-300 small text-center mt-2">
			© 2025 EnteBus. All rights reserved<br />Version 0.1.0
		</p>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.4);
		z-index: 1040;
	}
	.toggle-button {
		background-color: #3055ba;
	}
	.logo {
		width: 2rem;
		height: 2rem;
	}
	.mobile-header {
		background: linear-gradient(90deg, #1e3c72, #2a5298);
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		z-index: 10;
	}

	.sidebar {
		width: 15rem;
		background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%);
		color: #fff;
		position: fixed;
		transition: transform 0.3s ease-in-out;
		z-index: 1040;
	}

	/* Hide sidebar by default on mobile */
	@media (max-width: 1024px) {
		.sidebar {
			transform: translateX(-100%);
		}
		.sidebar.show {
			transform: translateX(0);
		}
		.mobile-header {
			display: flex !important;
		}
	}

	@media (max-width: 1024px) {
		.d-tablet-none {
			display: none !important;
		}
		.d-tablet-block {
			display: block !important;
		}
	}
	.nav-link {
		color: #cbd5e1;
		padding: 0.6rem 0.75rem;
		border-radius: 10px;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		transition: all 0.2s ease;
	}
	.nav-link:hover {
		background: #455b65b5;
		color: #fff;
	}
	.nav-link.active {
		background: #259acd;
		color: #fff;
	}
	.nav-section {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	.user-info {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 10px;
	}

	.accordion-button {
		box-shadow: none !important;
	}
	.accordion-button::after {
		display: none;
	}

	.user-menu {
		font-size: 0.9rem;
	}
	.footer-text {
		font-size: 0.75rem;
	}
	.footer-icon {
		background-color: #09df29;
	}
</style>
