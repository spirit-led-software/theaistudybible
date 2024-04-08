<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_CHAT_API_URL } from '$env/static/public';
  import Message from '$lib/components/chat/Message.svelte';
  import { session, user } from '$lib/stores/user';
  import Icon from '@iconify/svelte';
  import { updateAiResponse } from '@revelationsai/client/services/ai-response';
  import { hasPlus, isAdmin } from '@revelationsai/client/services/user';
  import type { RAIChatMessage } from '@revelationsai/core/model/chat/message';
  import type { ModelInfo } from '@revelationsai/core/model/llm';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { nanoid, type Message as ChatMessage } from 'ai';
  import { useChat } from 'ai/svelte';
  import { onMount } from 'svelte';
  import IntersectionObserver from 'svelte-intersection-observer';
  import TextAreaAutosize from './TextAreaAutosize.svelte';

  export let initChatId: string | undefined = undefined;
  export let initMessages: RAIChatMessage[] | undefined = undefined;
  export let modelInfos: { [key: string]: ModelInfo };

  let chatId: string | undefined = undefined;
  let modelId: string | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let lastUserMessageId: string | undefined = undefined;
  let lastAiResponseId: string | undefined = undefined;
  let lastModelId: string | undefined = undefined;
  let lastChatMessage: RAIChatMessage | undefined = undefined;
  let alert: string | undefined = undefined;
  let endOfMessagesRef: HTMLDivElement | undefined;
  let isEndOfMessagesRefShowing = true;

  const queryClient = useQueryClient();

  const starterQueries = [
    'Who is Jesus Christ?',
    'How does Jesus dying on the cross mean that I can be saved?',
    'What is the Trinity?',
    'Can you find me a random Bible verse about grief?',
    'What does the Bible say about marriage?'
  ];

  const { input, handleSubmit, messages, setMessages, append, error, isLoading, reload } = useChat({
    api: PUBLIC_CHAT_API_URL,
    initialMessages: initMessages as ChatMessage[] | undefined,
    sendExtraMessageFields: true,
    onError: (err) => {
      console.error('On Chat Error:', err);
      alert = err.message;
    },
    onResponse: async (response) => {
      if (!response.ok) {
        console.error("Couldn't send message", response.status, response.statusText);
        const data = await response.json();
        throw new Error(data.error ?? data.message ?? 'Something went wrong');
      }

      chatId = response.headers.get('x-chat-id') ?? undefined;
      lastUserMessageId = response.headers.get('x-user-message-id') ?? undefined;
      lastAiResponseId = response.headers.get('x-ai-response-id') ?? undefined;
      lastModelId = response.headers.get('x-model-id') ?? undefined;
    },
    onFinish: (message: ChatMessage) => {
      lastChatMessage = message;
      queryClient.invalidateQueries({ queryKey: ['infinite-chats'] });
    }
  });
  error.subscribe((err) => {
    if (err) {
      alert = err.message;
    }
  });

  onMount(() => {
    endOfMessagesRef?.scrollIntoView({
      behavior: 'instant',
      block: 'end'
    });
  });

  $: scrollEndIntoView = () => {
    if (!isEndOfMessagesRefShowing) {
      endOfMessagesRef?.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  $: handleReload = async () => {
    await reload({
      options: {
        headers: {
          authorization: `Bearer ${$session}`
        },
        body: {
          chatId,
          modelId
        }
      }
    });
  };

  $: handleSubmitCustom = (event: SubmitEvent) => {
    if ($input === '') {
      alert = 'Please enter a message';
    }
    handleSubmit(event, {
      options: {
        headers: {
          authorization: `Bearer ${$session}`
        },
        body: {
          chatId,
          modelId
        }
      }
    });
  };

  $: handleAiResponse = async (chatMessage: RAIChatMessage) => {
    if (lastAiResponseId) {
      try {
        $messages = [
          ...$messages.slice(0, -2),
          {
            ...$messages[$messages.length - 2],
            // @ts-expect-error adding our custom fields
            uuid: lastUserMessageId
          },
          {
            ...chatMessage,
            // @ts-expect-error adding our custom fields
            uuid: lastAiResponseId,
            modelId: lastModelId
          }
        ];
        await updateAiResponse(
          lastAiResponseId,
          {
            aiId: chatMessage.id
          },
          {
            session: $session!
          }
        );
      } catch (err) {
        alert = `Something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}`;
      }
    }
  };

  $: handleSearchParamQuery = async () => {
    const query = $page.url.searchParams.get('query')!;
    await goto($page.url.pathname, { replaceState: true, noScroll: true });
    append(
      {
        id: nanoid(),
        content: query,
        role: 'user'
      },
      {
        options: {
          headers: {
            authorization: `Bearer ${$session}`
          },
          body: {
            chatId,
            modelId
          }
        }
      }
    );
  };

  $: if (initChatId) {
    chatId = initChatId;
  }
  $: if (initMessages) {
    setMessages(initMessages as ChatMessage[]);
  }

  $: if (!$isLoading && lastChatMessage) handleAiResponse(lastChatMessage);
  $: if (alert) setTimeout(() => (alert = undefined), 8000);

  $: if ($page.url.searchParams.get('query')) {
    handleSearchParamQuery();
  }

  $: userHasPlus = hasPlus($user!) || isAdmin($user!);
</script>

<div class="absolute h-full w-full overflow-hidden lg:static">
  <div class="relative h-full w-full">
    <div
      role="alert"
      class={`absolute left-0 right-0 z-30 flex justify-center duration-300 ${
        alert ? 'top-1 scale-100' : '-top-20 scale-0'
      }`}
    >
      <div
        class="max-h-32 w-2/3 overflow-hidden truncate text-wrap rounded-lg bg-red-400 py-2 text-center text-white"
      >
        {alert}
      </div>
    </div>
    <div class="absolute left-0 right-0 top-1 z-50 flex justify-center">
      <div class="w-full overflow-hidden py-2 text-center">
        <select
          name="model"
          id="model"
          class="select select-sm bg-slate-700 text-white"
          bind:value={modelId}
          on:change={async (event) => {
            const selectedModelId = event.currentTarget.value;
            if (modelInfos[selectedModelId].tier === 'plus' && !userHasPlus) {
              await goto('/upgrade');
            }
          }}
        >
          {#each Object.keys(modelInfos) as modelId}
            <option value={modelId}>{modelInfos[modelId].name}</option>
          {/each}
        </select>
      </div>
    </div>
    {#if $messages && $messages.length > 0}
      <div class="h-full w-full overflow-y-scroll">
        <div class="flex min-h-full flex-1 flex-col place-content-end">
          <div class="h-16 w-full" />
          {#each $messages as message, index}
            <div class="flex w-full flex-col">
              <Message
                {modelInfos}
                {message}
                prevMessage={$messages[index - 1]}
                isChatLoading={$isLoading}
                isLastMessage={index === $messages.length - 1}
              />
            </div>
          {/each}
          <IntersectionObserver
            element={endOfMessagesRef}
            bind:intersecting={isEndOfMessagesRefShowing}
          >
            <div bind:this={endOfMessagesRef} class="h-20 w-full" />
          </IntersectionObserver>
        </div>
      </div>
    {:else}
      <div class="flex h-full w-full place-items-center justify-center justify-items-center">
        <div class="flex h-fit w-5/6 flex-col space-y-2 rounded-lg px-10 py-5 lg:w-1/2">
          <h1 class="self-center text-xl font-medium text-blue-300 md:text-2xl">
            Don{`'`}t know where to start?
          </h1>
          <h2 class="self-center text-lg">Try these:</h2>
          <ul class="list-outside space-y-2">
            {#each starterQueries as query}
              <li>
                <button
                  class="flex w-full place-items-center justify-between rounded-xl p-2 text-left text-base hover:cursor-pointer hover:bg-slate-300"
                  on:click={async () => {
                    await append(
                      {
                        id: nanoid(),
                        content: query,
                        role: 'user'
                      },
                      {
                        options: {
                          headers: {
                            authorization: `Bearer ${$session}`
                          },
                          body: {
                            chatId,
                            modelId
                          }
                        }
                      }
                    );
                  }}
                >
                  {query}
                  <Icon
                    icon="mdi:chevron-right"
                    class="mr-2 h-6 w-6 flex-shrink-0 flex-grow-0 text-slate-700"
                  />
                </button>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    {/if}
    {#if !isEndOfMessagesRefShowing}
      <button
        class="absolute bottom-20 right-5 rounded-full bg-white p-2 text-slate-700 shadow-lg hover:bg-slate-100 hover:text-slate-900 hover:shadow-xl"
        on:click|preventDefault={scrollEndIntoView}
      >
        <Icon icon="icon-park:down" class="text-2xl" />
      </button>
    {/if}
    <div class="absolute bottom-2 left-5 right-5 z-20 overflow-hidden opacity-90">
      <form
        class="mb-1 flex w-full flex-col rounded-lg border bg-white"
        on:submit|preventDefault={handleSubmitCustom}
      >
        <div class="flex h-auto w-full items-center">
          <Icon icon="icon-park:right" class="mx-1 text-2xl" />
          <TextAreaAutosize {input} />
          <div class="mr-2 flex">
            {#if $isLoading}
              <div class="mr-1 flex">
                <span class="loading loading-spinner loading-sm text-slate-800" />
              </div>
            {:else}
              <div class="flex space-x-1">
                <button
                  type="button"
                  tabindex={-1}
                  on:click|preventDefault={handleReload}
                  class="mr-1 text-2xl text-slate-700 hover:text-slate-900"
                >
                  <Icon icon="gg:redo" />
                </button>
                <button type="submit" class="mr-1 text-2xl text-slate-700 hover:text-slate-900">
                  <Icon icon="majesticons:send-line" />
                </button>
              </div>
            {/if}
          </div>
        </div>
      </form>
      <div class="flex w-full place-items-center">
        <p class="flex-1 truncate text-nowrap text-center text-[8px] text-gray-400 md:text-xs">
          RevelationsAI can make mistakes. Validate all answers against the bible.
        </p>
      </div>
    </div>
  </div>
</div>
