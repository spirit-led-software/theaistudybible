<script lang="ts">
  import Sidebar from '$lib/components/admin/Sidebar.svelte';
</script>

<div class="relative flex h-full w-full overflow-hidden">
  <Sidebar />
  <slot />
</div>
