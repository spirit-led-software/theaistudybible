<script lang="ts">
  import Window from '$lib/components/chat/Window.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  $: ({ modelInfos } = data);
</script>

<svelte:head>
  <title>New Chat</title>
  <meta name="description" content="Start a new chat with RevelationsAI" />
</svelte:head>

<Window {modelInfos} />
