<script lang="ts">
  export let label = "";
  export let value = "";
  export let options: string[] = [];
  export let error = "";
  export let onChange: (v: string) => void;

  let open = false;

  function selectOption(option: string) {
    onChange(option);
    open = false;
  }

  function toggle() {
    open = !open;
  }

  const selectedLabel = value ? value : `Select ${label}`;
</script>

<div class="dropdown-wrapper">
  <!-- Trigger -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="custom-dropdown-trigger {error ? 'is-invalid' : ''}"
    on:click={toggle}
  >
    <span>{selectedLabel}</span>
    <svg width="14" height="14">
      <path d="M4 5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="2" />
    </svg>
  </div>

  <!-- Menu -->
  {#if open}
    <div class="custom-dropdown-menu ">
      {#each options as option}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="custom-dropdown-item {option === value ? 'selected' : ''}"
          on:click={() => selectOption(option)}
        >
          <span>{option}</span>

          {#if option === value}
            <svg width="16" height="16" class="tick">
              <path
                d="M3 8l3 3 7-7"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
            </svg>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  {#if error}
    <div class="invalid-feedback d-block">{error}</div>
  {/if}
</div>

<style>
  .dropdown-wrapper {
    position: relative;
    width: 100%;
  }

  /* TRIGGER */
  .custom-dropdown-trigger {
    background-color: var(--bg-card);
    color: var(--text-primary);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    font-size: 0.9rem;
    padding: 0.55rem 0.75rem;
    transition: all 0.2s ease;
    cursor: pointer;

    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 48px;
  }

  .custom-dropdown-trigger:hover {
    background-color: var(--bg-hover);
    border-color: var(--primary);
  }

  .custom-dropdown-trigger.is-invalid {
    border-color: #d9534f;
  }

  /* DROPDOWN MENU */
  .custom-dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;

    background-color: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;

    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-top: 0.25rem;

    padding: 0.5rem 0;
    z-index: 1060;

    max-height: 200px;
    overflow-y: auto;
  }

  /* ITEMS */
  .custom-dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 0.5rem 0.75rem;
    color: var(--text-primary);

    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: none;
    width: 100%;
    font-size: 0.9rem;
  }

  .custom-dropdown-item:hover {
    background-color: #3a66f7;
    color: white;
    border-radius: 10px;
  }

  .tick {
    color: currentColor;
  }
</style>
