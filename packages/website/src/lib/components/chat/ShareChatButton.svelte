<script lang="ts">
  import { PUBLIC_API_URL, PUBLIC_WEBSITE_URL } from '$env/static/public';
  import { Button } from '$lib/components/ui/button';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { session } from '$lib/stores/user';
  import Icon from '@iconify/svelte';
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { copyText } from 'svelte-copy';
  import { toast } from 'svelte-sonner';
  import Spinner from '../ui/spinner/spinner.svelte';

  export let chatId: string | undefined;

  const qc = useQueryClient();

  const shareUrl = `${PUBLIC_WEBSITE_URL}/share/${chatId}`;

  $: query = createQuery({
    queryKey: ['is-chat-shared', { chatId }],
    queryFn: async () => {
      if (!chatId) {
        return false;
      }

      const response = await fetch(`${PUBLIC_API_URL}/chats/${chatId}/share`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${$session}`
        }
      });

      if (!response.ok) {
        return false;
      }
      return true;
    }
  });

  $: shareMutation = createMutation({
    mutationKey: ['share-chat', { chatId }],
    mutationFn: async () => {
      if (!chatId) {
        return;
      }

      const response = await fetch(`${PUBLIC_API_URL}/chats/${chatId}/share`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${$session}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to share chat');
      }

      return response.json();
    },
    onSuccess: () => {
      copyText(shareUrl);
      toast('Chat shared successfully. URL copied to clipboard.');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['is-chat-shared', { chatId }] });
    }
  });

  $: unshareMutation = createMutation({
    mutationKey: ['unshare-chat', { chatId }],
    mutationFn: async () => {
      if (!chatId) {
        return;
      }

      const response = await fetch(`${PUBLIC_API_URL}/chats/${chatId}/share`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${$session}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to unshare chat');
      }

      return response.json();
    },
    onSuccess: () => {
      toast('Chat unshared successfully');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['is-chat-shared', { chatId }] });
    }
  });

  let shared = false;
  let isLoading = false;

  $: shared = $query.data || false;
  $: isLoading = $query.isLoading || $shareMutation.isPending || $unshareMutation.isPending;
</script>

<Tooltip.Root>
  <Tooltip.Trigger asChild let:builder>
    <Button
      builders={[builder]}
      on:click={() => (shared ? $unshareMutation.mutate() : $shareMutation.mutate())}
      disabled={!chatId || isLoading}
      class="bg-secondary hover:bg-secondary rounded-r-none hover:opacity-90"
    >
      {#if isLoading}
        <Spinner variant="secondary-foreground" size="sm" />
      {:else}
        <Icon
          icon={shared ? 'mdi:check' : 'ion:share-outline'}
          class="text-secondary-foreground"
          width={20}
        />
      {/if}
    </Button>
  </Tooltip.Trigger>
  <Tooltip.Content side="bottom" class="w-1/2">
    {#if shared}
      <div class="p-3">
        <h1 class="text-lg font-medium">Chat Shared</h1>
        <p class="text-sm">Anyone with the link can view this chat</p>
        <p class="mb-1 text-sm text-gray-500">But don't worry, your identity is not shown</p>
        <div class="flex place-items-center justify-center rounded-xl border">
          <p class="truncate px-2 py-1">
            {shareUrl}
          </p>
          <Button
            class="mr-0 rounded-l-none"
            on:click={() => {
              copyText(shareUrl);
              toast('Copied to clipboard!');
            }}
          >
            <Icon icon="ion:copy-outline" width={16} height={16} class="text-primary-foreground" />
          </Button>
        </div>
      </div>
    {:else}
      <div class="p-3">
        <h1 class="text-lg font-medium">Share Chat</h1>
        <ul class="list-inside list-disc">
          <li>Always anonymous</li>
          <li>Share with anyone</li>
          <li>Easy to use link</li>
        </ul>
      </div>
    {/if}
  </Tooltip.Content>
</Tooltip.Root>
