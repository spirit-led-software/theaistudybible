<script lang="ts">
  import type { PageData } from './$types';
  import ChatWindow from './ChatWindow.svelte';

  export let data: PageData;
</script>

<ChatWindow
  modelInfos={data.modelInfos}
  user={data.chatUser}
  chat={data.chat}
  messages={data.chatMessages}
/>
