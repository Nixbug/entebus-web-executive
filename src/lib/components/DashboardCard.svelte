<script lang="ts">
  export let title: string;
  export let description: string;
  export let icon: string;
  export let href: string = '#';
  export let color: string = '#6c757d';
</script>

<a
  href={href}
  class="text-decoration-none"
>
  <div
    class="card h-100 shadow-sm border-0"
    style="background:var(--bg-card);color:var(--text-primary);"
  >
    <div class="card-body d-flex align-items-start gap-3">
      <i class="bi {icon} fs-3" style="color:{color};"></i>
      <div>
        <h6 class="card-title mb-1">{title}</h6>
        <p class="card-text small text-muted">{description}</p>
      </div>
    </div>
  </div>
</a>