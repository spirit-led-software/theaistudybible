<script lang="ts">
	import Sidebar from '$lib/components/devotion/Sidebar.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	let { devotions, activeDevoId } = data;
</script>

<div class="relative flex w-full h-full overflow-hidden">
	<Sidebar initDevos={devotions} {activeDevoId} />
	<slot />
</div>
