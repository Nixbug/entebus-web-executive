<script lang="ts">
    export let editable: any = {};
    export let isEditing = false;
</script>

<div class="avatar-card">
    <div class="avatar" style="background:{editable.color}">
        {editable.initials}
    </div>

    <h2>{editable.name} {#if editable.you}<span class="tag">You</span>{/if}</h2>

    <p class="role" >{editable.designation}</p>

    {#if editable.isActive}
        <span class="status active">Active</span>
    {:else}
        <span class="status inactive">Inactive</span>
    {/if}
</div>

<style>
    .avatar-card {
        background: rgba(85, 163, 227, 0.15);
        border-radius: 20px;
        padding: 32px 20px;
        text-align: center;
        box-shadow: inset 0 0 30px rgba(0,0,0,0.04);
    }
    .avatar {
        width: 82px;
        height: 82px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 26px;
        color: #fff;
        margin: 0 auto;
        border: 2px solid var(--field-border);
    }
    h2{
        color: var(--text-primary);
    }
    p{
        color: var(--text-muted);
    }
    .status {
        display: inline-block;
        margin-top: 12px;
        padding: 4px 14px;
        border-radius: 30px;
        font-size: 12px;
    }
    .active { background: #d3f5d7; color: #188d35; }
    .inactive { background: #ffdddd; color: #b60000; }
</style>
