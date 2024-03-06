<script lang="ts">
  // @ts-expect-error These packages don't have types
  import { Email, Facebook, X } from 'svelte-share-buttons-component';

  import { PUBLIC_WEBSITE_URL } from '$env/static/public';
  import Icon from '@iconify/svelte';
  import type { RAIChatMessage } from '@revelationsai/core/model/chat/message';
  import type { ModelInfo } from '@revelationsai/core/model/llm';
  import type { User } from '@revelationsai/core/model/user';
  import type { Message } from 'ai';
  import Day from 'dayjs';
  import LogoIcon from '../branding/LogoIcon.svelte';
  import Avatar from '../user/Avatar.svelte';
  import CopyButton from './CopyButton.svelte';
  import MessageMarkdown from './MessageMarkdown.svelte';
  import ResponseSources from './ResponseSources.svelte';

  export let user: User | undefined = undefined;
  export let message: RAIChatMessage;
  export let prevMessage: RAIChatMessage | undefined = undefined;
  export let isChatLoading = false;
  export let isLastMessage = false;
  export let modelInfos: { [k: string]: ModelInfo };

  const url = `${PUBLIC_WEBSITE_URL}/chat`;

  let includePreviousMessage: boolean = false;
  let sharableContent: string = message.content;
  let shareModal: HTMLDialogElement | undefined = undefined;

  let id: string;
  let uuid: string | undefined;
  let role: Message['role'];
  let content: string;

  $: ({ id, uuid, role, content } = message);

  $: if (includePreviousMessage && prevMessage) {
    const { role: prevRole, content: prevContent } = prevMessage;
    sharableContent = `${prevRole === 'user' ? 'Me' : 'RevelationsAI'}: ${prevContent}\n\n${
      role === 'user' ? 'Me' : 'RevelationsAI'
    }: ${content}`;
  } else {
    sharableContent = `${role === 'user' ? 'Me' : 'RevelationsAI'}: ${content}`;
  }
</script>

<div class="flex w-full flex-row overflow-x-hidden border border-t-slate-300 bg-white px-2 py-4">
  <div class="flex w-16 flex-col content-start">
    {#if role === 'user'}
      <Avatar {user} size="lg" class="border border-slate-100 shadow-xl" />
    {:else}
      <LogoIcon size="sm" class="w-12 rounded-full shadow-xl" />
    {/if}
  </div>
  <div class="flex w-full flex-col overflow-x-clip px-3">
    <MessageMarkdown {content} />
    <div class="flex w-full place-items-center justify-end space-x-2">
      {#if message.modelId}
        <div class="mt-2 flex justify-end text-xs text-gray-400">
          <span class="rounded-xl border px-2 py-1">
            {modelInfos[message.modelId]?.name ?? message.modelId}
          </span>
        </div>
      {/if}
      <div class="mt-2 flex justify-end text-xs text-gray-400">
        {Day(message.createdAt).format('M/D/YY h:mm a')}
      </div>
    </div>
    {#if role !== 'user' && !(isLastMessage && isChatLoading)}
      <div class="flex w-full place-items-end justify-between">
        <ResponseSources aiResponseId={uuid ?? id} {isChatLoading} />
        <div class="join flex">
          <CopyButton btnClass="btn-xs btn-ghost join-item" {content} />
          <dialog bind:this={shareModal} class="modal">
            <form method="dialog" class="modal-box flex w-fit flex-col space-y-2">
              <h1 class="text-bold">Share to:</h1>
              <div class="flex place-items-center justify-center space-x-2">
                <Email
                  class="flex h-12 w-12 place-items-center justify-center overflow-hidden rounded-full"
                  subject="Response from RevelationsAI"
                  body={`${sharableContent}\n\n${url}`}
                />
                <Facebook
                  class="flex h-12 w-12 place-items-center justify-center overflow-hidden rounded-full"
                  {url}
                  quote={sharableContent}
                />
                <X
                  class="flex h-12 w-12 place-items-center justify-center overflow-hidden rounded-full"
                  text={sharableContent}
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
              <p class="text-xs text-gray-400">Text will also be copied to your clipboard!</p>
            </form>
            <form method="dialog" class="modal-backdrop">
              <button>close</button>
            </form>
          </dialog>
          <button
            class="btn btn-xs btn-ghost join-item"
            on:click={() => {
              shareModal?.showModal();
            }}
          >
            <Icon icon="lucide:share" width={16} height={16} />
          </button>
        </div>
      </div>
    {:else}
      <div class="flex place-items-end justify-end">
        <CopyButton btnClass="btn-xs btn-ghost" content={sharableContent} />
      </div>
    {/if}
  </div>
</div>
