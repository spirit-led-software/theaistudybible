<script lang="ts">
	import Window from '$lib/components/chat/Window.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ chat, user, messages } = data);
</script>

<svelte:head>
	<title>Chat: {chat.name}</title>
</svelte:head>

<Window {user} initChatId={chat.id} initMessages={messages} />
