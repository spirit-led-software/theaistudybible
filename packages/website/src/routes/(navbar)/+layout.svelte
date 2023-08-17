<script lang="ts">
	import NavBar from '$lib/components/NavBar.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<div class="flex flex-col h-screen">
	<NavBar user={data.user} />
	<slot />
</div>
