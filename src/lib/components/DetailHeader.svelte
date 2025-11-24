<script lang="ts">
    export let title = "";
    export let isEditing = false;
    export let onEdit = () => {};
    export let onDelete = () => {};
    export let onClose = () => {};
</script>

<header class="header">
    <h5 class="fw-inter-700 fs-6 title">{title}</h5>

    <div class="actions">
        {#if !isEditing}
            <!-- Edit -->
            <button class="icon-btn edit" on:click={onEdit}>
                <i class="bi bi-pencil"></i>
            </button>

            <!-- Delete -->
            <button class="icon-btn delete" on:click={onDelete}>
                <i class="bi bi-trash"></i>
            </button>
        {/if}

        <!-- Close -->
        <button class="icon-btn close" on:click={onClose}>
            <i class="bi bi-x-lg"></i>
        </button>
    </div>
</header>

<style>
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-card);
        border-bottom: 1px solid var(--border);
        padding: 14px 18px;
    }

    .title {
        color: var(--text-primary);
        margin: 0;
    }

    .actions {
        display: flex;
        gap: 10px;
    }

    /* Base button styling */
    .icon-btn {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.04);
        color: var(--text-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: 0.2s ease-in-out;
        font-size: 18px;
    }

    /* Hover color rules */
    .icon-btn.edit:hover {
        border-color: #0d6efd;
        color: #0d6efd;
        background: rgba(13, 110, 253, 0.1);
    }

    .icon-btn.delete:hover {
        border-color: #dc3545;
        color: #dc3545;
        background: rgba(220, 53, 69, 0.1);
    }

    .icon-btn.close:hover {
        border-color: #dc3545;
        color: #dc3545;
        background: rgba(220, 53, 69, 0.1);
    }
</style>

