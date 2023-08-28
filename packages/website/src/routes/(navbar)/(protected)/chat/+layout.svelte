<script lang="ts">
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/chat/Sidebar.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: ({ chats } = data);
</script>

<div class="relative flex w-full h-full overflow-hidden">
	<Sidebar initChats={chats} activeChatId={$page.params.id} />
	<slot />
</div>
