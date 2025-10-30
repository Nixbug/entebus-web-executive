<script>
	import entebusLogo from '$lib/assets/entebus_logo.png';
</script>


<div class="sidebar d-flex flex-column vh-100 p-3">
	<!-- Logo Section -->
	<div class="logo-container d-flex align-items-center gap-2">
		<img src={entebusLogo} style="width: 60px; height: 60px;" alt="EnteBus Logo" />
		<h5 class="m-0 fw-bold">EnteBus</h5>
	</div>
    <hr>
	<!-- Executives Section -->
	<p class="nav-section">EXECUTIVES</p>

	<ul class="nav flex-column">
		<li>
			<a href="/executive-account" class="nav-link ">
				<i class="bi bi-person"></i> Account
			</a>
		</li>
		<li>
			<a href="/executive-role" class="nav-link">
				<i class="bi bi-person-gear"></i> Role
			</a>
		</li>
		<li>
			<a href="/executive-landmark" class="nav-link">
				<i class="bi bi-geo-alt"></i> Landmark
			</a>
		</li>
		<li>
			<a href="/executive-fare" class="nav-link">
				<i class="bi bi-currency-rupee"></i> Global Fare
			</a>
		</li>
		<li>
			<a href="/executive-company" class="nav-link">
				<i class="bi bi-buildings"></i> Company
			</a>
		</li>
	</ul>

	<!-- Footer Section -->
	<div class="footer">
		<div class="user-info">
			<i class="bi bi-person-circle"></i>
			<div>
				<div style="font-size: 0.8rem;">Profile</div>
			</div>
		</div>
		<p>© 2025 EnteBus. All rights reserved.<br />Version 0.0.1</p>
	</div>
</div>

<style>
	.sidebar {
        width: 15rem;
		background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%);
		color: #fff;
	}
	.nav-section {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.5px;
		color: #9ca3af;
		margin: 1rem 0 0.5rem 0.75rem;
	}

	.nav-link {
		color: #cbd5e1;
		padding: 0.6rem 0.75rem;
		border-radius: 10px;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		transition: background 0.2s ease;
		font-weight: 500;
	}

	.nav-link i {
		font-size: 1.1rem;
	}

	.nav-link:hover {
		background: #2563eb;
		color: #fff;
	}

	.footer {
		margin-top: auto;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding-top: 1rem;
		color: #9ca3af;
		text-align: center;
		font-size: 0.75rem;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: #fff;
		padding: 0.5rem 0.75rem;
		border-radius: 10px;
		margin-bottom: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
	}

	.user-info i {
		background: #16a34a;
		border-radius: 50%;
		padding: 0.5rem;
		font-size: 1.2rem;
	}
</style>
