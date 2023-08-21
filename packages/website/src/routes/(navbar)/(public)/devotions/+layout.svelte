<script lang="ts">
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/devotion/Sidebar.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: ({ devotions } = data);
</script>

<div class="relative flex w-full h-full overflow-hidden">
	<Sidebar initDevos={devotions} activeDevoId={$page.params.id} />
	<slot />
</div>
