<script lang="ts">
	import Window from '$lib/components/chat/Window.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<Window user={data.user} initChatId={data.chat.id} initMessages={data.messages} />
