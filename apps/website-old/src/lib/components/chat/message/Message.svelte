<script lang="ts">
  import type { RAIChatMessage } from '@revelationsai/core/model/chat/message';
  import type { ModelInfo } from '@revelationsai/core/model/llm';
  import type { User } from '@revelationsai/core/model/user';
  import Day from 'dayjs';
  import LogoIcon from '../../branding/LogoIcon.svelte';
  import AnonymousAvatar from '../../user/AnonymousAvatar.svelte';
  import Avatar from '../../user/Avatar.svelte';
  import CopyButton from './CopyButton.svelte';
  import MessageMarkdown from './MessageMarkdown.svelte';
  import ResponseSources from './ResponseSources.svelte';
  import ShareMessageButton from './ShareMessageButton.svelte';

  export let user: User | undefined = undefined;
  export let message: RAIChatMessage;
  export let prevMessage: RAIChatMessage | undefined = undefined;
  export let isChatLoading = false;
  export let isLastMessage = false;
  export let modelInfos: { [k: string]: ModelInfo };

  let includePreviousMessage: boolean = false;
  let sharableContent: string = message.content;

  let id: string;
  let uuid: string | undefined;
  let role: RAIChatMessage['role'];
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

<div class="border-t-foreground relative flex w-full flex-row border px-2 py-5">
  {#if message.modelId}
    <div
      class="bg-background border-foreground absolute -top-4 left-1 mt-2 flex-shrink-0 rounded-xl border text-xs"
    >
      <span class="px-2 py-1">
        {modelInfos[message.modelId]?.name ?? message.modelId}
      </span>
    </div>
  {/if}
  <div class="flex w-12 flex-col content-start">
    {#if role === 'user'}
      <Avatar {user} size="lg" class="border border-slate-100 shadow-xl" />
    {:else if role === 'anonymous'}
      <AnonymousAvatar size="sm" class="border border-slate-100 shadow-xl" />
    {:else}
      <LogoIcon size="sm" class="w-12 rounded-full shadow-xl" />
    {/if}
  </div>
  <div class="flex w-full flex-col overflow-x-clip px-3">
    <MessageMarkdown {content} />
    <div
      class={`flex w-full ${role !== 'user' && !(isLastMessage && isChatLoading) ? 'justify-between' : 'justify-end'}`}
    >
      {#if role !== 'user' && !(isLastMessage && isChatLoading)}
        <div class="flex w-3/4 lg:w-4/5">
          <ResponseSources aiResponseId={uuid ?? id} {isChatLoading} />
        </div>
      {/if}
      <div class="flex w-1/4 flex-col place-items-end justify-start lg:w-1/5">
        <div class="flex place-items-end justify-end space-x-2">
          <div class="mt-2 flex-shrink-0 text-xs text-gray-400">
            {Day(message.createdAt).format('M/D/YY h:mm a')}
          </div>
        </div>
        <div class="mt-1 flex place-items-start justify-end">
          {#if role !== 'user' && !(isLastMessage && isChatLoading)}
            <div class="flex">
              <ShareMessageButton {message} content={sharableContent} {includePreviousMessage} />
              <CopyButton content={sharableContent} btnClass="rounded-l-none" />
            </div>
          {:else}
            <CopyButton content={sharableContent} />
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
