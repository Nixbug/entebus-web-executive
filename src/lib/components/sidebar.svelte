<script>
	import entebusLogo from '$lib/assets/entebus_logo.png';
	import { page } from '$app/stores';
	let sidebarOpen = false;

	const executiveLinks = [
		{ href: '/executive-account', icon: 'bi-person', label: 'Account' },
		{ href: '/executive-role', icon: 'bi-person-gear', label: 'Role' },
		{ href: '/executive-landmark', icon: 'bi-geo-alt', label: 'Landmark' },
		{ href: '/executive-fare', icon: 'bi-currency-rupee', label: 'Global Fare' },
		{ href: '/executive-company', icon: 'bi-buildings', label: 'Company' }
	];
</script>

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
		<h5 class="mb-0 text-white fw-semibold">EnteBus</h5>
	</div>
</div>

<!-- Sidebar -->
<div
	class="sidebar vh-100 p-3 d-flex flex-column"
	class:show={sidebarOpen}
>
	<!-- Logo Section -->
	<div class="logo-container d-flex align-items-center  gap-4 ">
		<img src={entebusLogo} style="width: 45px; height: 45px;" alt="EnteBus Logo" />
		<h5 class="m-0 fw-inter-700">EnteBus</h5>
        <!-- Close Icon (visible only on mobile) -->
        <button
		class="btn btn-sm d-md-none align-self-end mb-2"
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
				<a
					href={link.href}
					class="nav-link"
					class:active={$page.url.pathname === link.href}
				>
					<i class="{link.icon} fs-5"></i> {link.label}
				</a>
			</li>
		{/each}
	</ul>
	<!-- Footer -->
	<div class="footer mt-auto text-center small text-light opacity-75">
		<div class="user-info d-flex align-items-center gap-2 p-2 mb-2 justify-content-center">
			<i class="bi bi-person-circle p-1 fs-6"></i>
			<a href="/user-profile" style="color: #fff; text-decoration: none">Profile</a>
		</div>
		<p class="footer-text m-0 fw-inter-300">© 2025 EnteBus. All rights reserved<br />Version 0.0.1</p>
	</div>
</div>

<style>
    .toggle-button {
        background-color: #3055ba;
    }
    .logo {
	width: 30px;
	height: 30px;
}
    .mobile-header {
	background: linear-gradient(90deg, #1e3c72, #2a5298);
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
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
	@media (max-width: 767.98px) {
		.sidebar {
			transform: translateX(-100%);
		}
		.sidebar.show {
			transform: translateX(0);
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
    .footer-text {
        font-size: 0.75rem;
    }
</style>
