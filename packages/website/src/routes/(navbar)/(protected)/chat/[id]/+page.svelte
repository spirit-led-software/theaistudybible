<script lang="ts">
	import Window from '$lib/components/chat/Window.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ chat, messages } = data);
</script>

<svelte:head>
	<title>Chat: {chat.name}</title>
	<meta name="description" content="Chat: {chat.name}" />
</svelte:head>

<Window initChatId={chat.id} initMessages={messages} />
