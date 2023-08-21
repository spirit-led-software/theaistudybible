<script lang="ts">
	import Sidebar from '$lib/components/admin/Sidebar.svelte';
</script>

<div class="relative flex w-full h-full overflow-hidden">
	<Sidebar />
	<div class="flex flex-1 h-full">
		<div class="flex w-full h-full p-5">
			<slot />
		</div>
	</div>
</div>
