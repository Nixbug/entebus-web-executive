<script lang="ts">
  import HeaderBar from '$lib/components/HeaderBar.svelte';
  import DashboardCard from '$lib/components/DashboardCard.svelte';
</script>

<HeaderBar />

<main class="container-fluid py-4" style="background:var(--bg-primary);">
  <section class="mb-5">
    <h2 class="h4">Welcome back, John!</h2>
    <p class="text-muted">Manage your executive dashboard and business operations from here.</p>
  </section>

  <div class="row g-4">
    <!-- Row 1 -->
    <div class="col-12 col-md-6 col-lg-3">
      <DashboardCard
        title="Account"
        description="Manage user accounts and permissions"
        icon="bi-person-fill"
        color="#0d6efd"
        href="/account"
      />
    </div>

    <div class="col-12 col-md-6 col-lg-3">
      <DashboardCard
        title="Role Management"
        description="Define and assign user roles"
        icon="bi-shield-lock-fill"
        color="#198754"
        href="/roles"
      />
    </div>

    <div class="col-12 col-md-6 col-lg-3">
      <DashboardCard
        title="Landmarks"
        description="Configure location landmarks"
        icon="bi-geo-alt-fill"
        color="#6f42c1"
        href="/landmarks"
      />
    </div>

    <div class="col-12 col-md-6 col-lg-3">
      <DashboardCard
        title="Global Fare"
        description="Set and manage fare structures"
        icon="bi-currency-rupee"
        color="#fd7e14"
        href="/fare"
      />
    </div>

    <!-- Row 2 (Company) -->
    <div class="col-12 col-md-6 col-lg-3 offset-lg-3">
      <DashboardCard
        title="Company"
        description="Manage company settings and details"
        icon="bi-building"
        color="#6c757d"
        href="/company"
      />
    </div>
  </div>
</main>

<style>
  /* tiny tweak for the “Company” card to sit in the middle on lg screens */
  @media (min-width: 992px) {
    .offset-lg-3 { margin-left: 25%; }
  }
</style>