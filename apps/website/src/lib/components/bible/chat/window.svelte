<script lang="ts">
  import { env } from '$env/dynamic/public';
  import Icon from '$lib/components/branding/icon.svelte';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import { Separator } from '$lib/components/ui/separator';
  import { useBibleStore } from '$lib/runes/bible.svelte';
  import { useChatStore } from '$lib/runes/chat.svelte';
  import { useAuth, useUser } from '$lib/runes/clerk.svelte';
  import { cn } from '$lib/utils';
  import { createId } from '@paralleldrive/cuid2';
  import { useChat } from 'ai/svelte';
  import SignInButton from 'clerk-sveltekit/client/SignInButton.svelte';
  import { ChevronDown, Send } from 'lucide-svelte';
  import { Button, buttonVariants } from '../../ui/button';
  import { Input } from '../../ui/input';
  import { H3, P } from '../../ui/typeography';

  const { chatOpen, setChatOpen } = useBibleStore();
  const { chatId, setChatId, query, setQuery } = useChatStore();
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();

  let lastAiResponseId = $state<string | undefined>(undefined);

  const { input, handleSubmit, messages, setMessages, error, isLoading, append } = useChat({
    api: `${env.PUBLIC_API_URL}/chat`,
    id: chatId,
    generateId: createId,
    sendExtraMessageFields: true,
    onResponse(response) {
      const newChatId = response.headers.get('x-chat-id');
      if (newChatId) {
        setChatId(newChatId);
      }
      const aiResponseId = response.headers.get('x-ai-response-id');
      if (aiResponseId) {
        lastAiResponseId = aiResponseId;
      }
    }
  });

  let alert = $state<string | undefined>(undefined);

  $effect(() => {
    if (lastAiResponseId && !isLoading) {
      setMessages([
        ...$messages.slice(0, -1),
        {
          ...$messages.at(-1)!,
          id: lastAiResponseId
        }
      ]);
      lastAiResponseId = undefined;
    }
  });

  const appendQuery = $derived(async (query: string) => {
    append(
      {
        role: 'user',
        content: query
      },
      {
        options: {
          headers: {
            Authorization: `Bearer ${await getToken()}`
          }
        }
      }
    );
    setQuery(undefined);
  });

  $effect(() => {
    if (query) {
      appendQuery(query);
    }
  });

  $effect(() => {
    if ($error) {
      alert = $error.message;
    }
  });

  $effect(() => {
    if (alert) {
      setTimeout(() => {
        alert = undefined;
      }, 5000);
    }
  });
</script>

<div
  class={`fixed bottom-0 left-12 right-12 z-40 flex flex-col overflow-hidden rounded-t-lg border bg-background shadow-xl duration-200 md:left-1/4 md:right-1/4 xl:left-1/3 xl:right-1/3 ${chatOpen ? 'h-2/3 delay-200' : 'h-0'}`}
>
  <div class="flex w-full place-items-center justify-between bg-primary px-1 py-2">
    <H3 class="px-2 text-primary-foreground">Chat</H3>
    <Button
      variant={'ghost'}
      onclick={() => setChatOpen(!chatOpen)}
      class="px-2 text-primary-foreground"
    >
      <ChevronDown size={20} />
    </Button>
  </div>
  {#if isSignedIn}
    <div class="relative flex-1 flex-col-reverse space-y-2 overflow-y-auto whitespace-pre-wrap">
      {#each $messages as message}
        <div class="flex w-full flex-col">
          <Separator orientation="horizontal" class="w-full" />
          <div class="flex w-full place-items-start space-x-4 px-2 py-3">
            {#if message.role === 'user'}
              <Avatar>
                <AvatarImage src={user!.imageUrl!} />
                <AvatarFallback>{user?.fullName}</AvatarFallback>
              </Avatar>
            {:else}
              <div
                class="flex h-10 w-10 flex-shrink-0 place-items-center justify-center overflow-hidden rounded-full bg-primary p-2"
              >
                <Icon width={50} height={50} class="flex-shrink-0" />
              </div>
            {/if}
            <p>{message.content}</p>
          </div>
        </div>
      {/each}
    </div>
    <form
      class="relative flex w-full px-2 py-2"
      onsubmit={async (e) => {
        e.preventDefault();
        if (!input) {
          alert = 'Please type a message';
          return;
        }
        handleSubmit(e, {
          options: {
            headers: {
              Authorization: `Bearer ${await getToken({
                template: 'Testing'
              })}`
            }
          }
        });
      }}
    >
      {#if alert}
        <div
          class="absolute -top-10 left-1 right-1 z-50 mx-auto my-1 flex max-h-24 place-items-center justify-center overflow-clip"
        >
          <p class="truncate rounded-xl bg-destructive p-2 text-destructive-foreground">{alert}</p>
        </div>
      {/if}
      <Input placeholder="Type a message" bind:value={$input} class="rounded-r-none" />
      <Button type="submit" class="rounded-l-none">
        <Send size={20} />
      </Button>
    </form>
  {:else}
    <div class="flex h-full w-full flex-col place-items-center justify-center">
      <P>
        Please{' '}
        <SignInButton
          class={cn(buttonVariants({ variant: 'link' }), 'px-0 capitalize text-accent-foreground')}
          disabled={$isLoading}
        />{' '}
        to chat
      </P>
    </div>
  {/if}
</div>
