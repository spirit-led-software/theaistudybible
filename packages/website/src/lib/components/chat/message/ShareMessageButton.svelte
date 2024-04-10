<script lang="ts">
  // @ts-expect-error - No types for svelte-share-buttons-component
  import { Email, Facebook, X } from 'svelte-share-buttons-component';

  import { PUBLIC_WEBSITE_URL } from '$env/static/public';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import Icon from '@iconify/svelte';
  import type { RAIChatMessage } from '@revelationsai/core/model/chat/message';

  export let message: RAIChatMessage;
  export let includePreviousMessage: boolean;
  export let content: string;

  const url = `${PUBLIC_WEBSITE_URL}/chat`;

  $: ({ id } = message);
</script>

<Dialog.Root>
  <Dialog.Trigger asChild let:builder>
    <Button builders={[builder]} variant="outline" class="rounded-r-none">
      <Icon icon="ion:share-outline" width={16} height={16} class="text-foreground" />
    </Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Share</Dialog.Title>
    </Dialog.Header>
    <div class="flex place-items-center justify-center space-x-2">
      <Email
        class="flex h-12 w-12 place-items-center justify-center overflow-hidden rounded-full"
        subject="Response from RevelationsAI"
        body={`${content}\n\n${url}`}
      />
      <Facebook
        class="flex h-12 w-12 place-items-center justify-center overflow-hidden rounded-full"
        {url}
        quote={content}
      />
      <X
        class="flex h-12 w-12 place-items-center justify-center overflow-hidden rounded-full"
        text={content}
        {url}
        hashtags="revelationsai,ai,christ,jesus"
      />
    </div>
    <div class="flex place-items-center justify-center space-x-2">
      <label for={`include-message-${id}`}>Include your message</label>
      <input
        tabindex="-1"
        id={`include-message-${id}`}
        type="checkbox"
        class="checkbox checkbox-primary checkbox-sm"
        bind:checked={includePreviousMessage}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>
