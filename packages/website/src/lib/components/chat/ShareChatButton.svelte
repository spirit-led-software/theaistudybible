<script lang="ts">
  import { PUBLIC_API_URL, PUBLIC_WEBSITE_URL } from '$env/static/public';
  import { Button } from '$lib/components/ui/button';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { session } from '$lib/stores/user';
  import Icon from '@iconify/svelte';
  import { copyText } from 'svelte-copy';
  import { toast } from 'svelte-sonner';

  export let chatId: string | undefined;

  let shared = false;

  const handleShareClick = async () => {
    if (shared) {
      return;
    }

    const response = await fetch(`${PUBLIC_API_URL}/chats/${chatId}/share`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${$session}`
      }
    });

    if (!response.ok) {
      toast('Failed to share chat');
      return;
    }

    const url = `${PUBLIC_WEBSITE_URL}/share/${chatId}`;
    copyText(url);

    shared = true;
    toast('Link copied to clipboard!');
  };
</script>

<Tooltip.Root>
  <Tooltip.Trigger asChild let:builder>
    <Button
      builders={[builder]}
      on:click={handleShareClick}
      disabled={!chatId}
      class="bg-secondary hover:bg-secondary hover:opacity-90"
    >
      <Icon
        icon={shared ? 'mdi:check' : 'ion:share-outline'}
        class="text-secondary-foreground"
        width={20}
      />
    </Button>
  </Tooltip.Trigger>
  <Tooltip.Content side="bottom">
    <div class="p-3">
      <h1 class="text-lg font-medium">Share Chat</h1>
      <ul class="list-inside list-disc">
        <li>Always anonymous</li>
        <li>Share with anyone</li>
        <li>Easy to use link</li>
      </ul>
    </div>
  </Tooltip.Content>
</Tooltip.Root>
