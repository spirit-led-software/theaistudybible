<script lang="ts">
	import Sidebar from '$lib/components/admin/Sidebar.svelte';
</script>

<div class="relative flex w-full h-full overflow-hidden">
	<Sidebar />
	<slot />
</div>
