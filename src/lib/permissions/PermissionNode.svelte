<script lang="ts">
    import type { Writable } from "svelte/store";
    import type { PermissionNodeData } from "$lib/permissions/permission-tree";
    import {
        getNodeState,
        toggleActionClone,
        toggleAllClone,
        countPermissions
    } from "$lib/permissions/permission-utils";

    import PermissionNode from "./PermissionNode.svelte";

    export let node: PermissionNodeData;
    export let state: Writable<any>;
    export let path: string[] = [];

    let open = true;
    let isAll = false;

    $: nextPath = [...path, node.id];
    $: snapshot = $state;
    $: nodeState = getNodeState(snapshot, nextPath) ?? {};
    $: counts = countPermissions(nodeState);

    $: {
        const keys = Object.keys(nodeState).filter(k => typeof nodeState[k] === "boolean");
        isAll = keys.length > 0 && keys.every(k => nodeState[k]);
    }

    function handleToggleAction(action: string) {
        state.update(s => toggleActionClone(s, nextPath, action));
    }

    function handleToggleAll() {
        state.update(s => toggleAllClone(s, nextPath));
    }
</script>

<div class="perm-node">
    <!-- HEADER -->
    <div class="perm-header">
        <button class="chevron" on:click={() => (open = !open)}>
            <i class="bi" class:bi-chevron-down={open} class:bi-chevron-right={!open}></i>
        </button>

        <i class="bi bi-folder2 text-primary"></i>

        <span class="title">{node.label}</span>

        <span class="count">{counts.enabled}/{counts.total}</span>

        <div class="all-toggle">
            <span>All</span>
            <label class="form-check form-switch m-0">
                <input
                    class="form-check-input"
                    type="checkbox"
                    checked={isAll}
                    on:change={handleToggleAll}
                />
            </label>
        </div>
    </div>

    {#if open}
        <!-- ACTION ROW -->
        <div class="action-row">
            {#each node.actions as action}
                <label class="form-check form-switch action-item">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        checked={nodeState[action]}
                        on:change={() => handleToggleAction(action)}
                    />
                    <span class="action-label">{action}</span>
                </label>
            {/each}
        </div>

        {#if node.children?.length}
            <div class="children">
                {#each node.children as child}
                    <PermissionNode node={child} {state} path={nextPath} />
                {/each}
            </div>
        {/if}
    {/if}
</div>

<style>
    /* Outer wrapper – no cards, no borders */
    .perm-node {
        padding: 6px 0;
    }

    /* ========== HEADER ========== */
    .perm-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 4px;
    }

    .chevron {
        border: none;
        background: none;
        padding: 2px;
        cursor: pointer;
    }

    .title {
        font-weight: 600;
    }

    .count {
        font-size: 12px;
        color: #999;
    }

    .all-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: auto;
        font-size: 12px;
        color: #666;
    }

    /* ========== ACTION ROW ========== */
    .action-row {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-left: 32px;
        padding: 10px;
        background: var(--bg-card);
        border-radius: 8px;
        border: 1px solid rgba(0,0,0,0.05);
    }

    .action-label {
        text-transform: capitalize;
        font-size: 13px;
    }

    /* ========== CHILDREN ========== */
    .children {
        border-left: 2px solid rgba(0, 123, 255, 0.25);
        margin-left: 28px;
        padding-left: 12px;
        margin-top: 12px;
    }
</style>
