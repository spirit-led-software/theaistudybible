<script lang="ts">
	// @ts-expect-error These packages don't have types
	import { Email, Facebook, X } from 'svelte-share-buttons-component';

	import { PUBLIC_WEBSITE_URL } from '$env/static/public';
	import Icon from '@iconify/svelte';
	import type { RAIChatMessage } from '@revelationsai/core/model/chat/message';
	import type { ModelInfo } from '@revelationsai/core/model/llm';
	import type { Message } from 'ai';
	import Day from 'dayjs';
	import LogoIcon from '../branding/LogoIcon.svelte';
	import Avatar from '../user/Avatar.svelte';
	import CopyButton from './CopyButton.svelte';
	import MessageMarkdown from './MessageMarkdown.svelte';
	import ResponseSources from './ResponseSources.svelte';

	export let chatId: string | undefined;
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

<div class="flex flex-row w-full px-2 py-4 overflow-x-hidden bg-white border border-t-slate-300">
	<div class="flex flex-col content-start w-16">
		{#if role === 'user'}
			<Avatar size="lg" class="border shadow-xl border-slate-100" />
		{:else}
			<LogoIcon size="sm" class="w-12 rounded-full shadow-xl" />
		{/if}
	</div>
	<div class="flex flex-col w-full px-3 overflow-x-clip">
		<MessageMarkdown {content} />
		<div class="flex w-full justify-end place-items-center space-x-2">
			{#if message.modelId}
				<div class="flex justify-end mt-2 text-xs text-gray-400">
					<span class="border px-2 py-1 rounded-xl">
						{modelInfos[message.modelId]?.name ?? message.modelId}
					</span>
				</div>
			{/if}
			<div class="flex justify-end mt-2 text-xs text-gray-400">
				{Day(message.createdAt).format('M/D/YY h:mm a')}
			</div>
		</div>
		{#if role !== 'user' && !(isLastMessage && isChatLoading)}
			<div class="flex justify-between w-full place-items-end">
				<ResponseSources aiResponseId={uuid ?? id} {chatId} {isChatLoading} />
				<div class="flex join">
					<CopyButton btnClass="btn-xs btn-ghost join-item" {content} />
					<dialog bind:this={shareModal} class="modal">
						<form method="dialog" class="flex flex-col space-y-2 modal-box w-fit">
							<h1 class="text-bold">Share to:</h1>
							<div class="flex justify-center space-x-2 place-items-center">
								<Email
									class="flex justify-center w-12 h-12 overflow-hidden rounded-full place-items-center"
									subject="Response from RevelationsAI"
									body={`${sharableContent}\n\n${url}`}
								/>
								<Facebook
									class="flex justify-center w-12 h-12 overflow-hidden rounded-full place-items-center"
									{url}
									quote={sharableContent}
								/>
								<X
									class="flex justify-center w-12 h-12 overflow-hidden rounded-full place-items-center"
									text={sharableContent}
									{url}
									hashtags="revelationsai,ai,christ,jesus"
								/>
							</div>
							<div class="flex justify-center space-x-2 place-items-center">
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
			<div class="flex justify-end place-items-end">
				<CopyButton btnClass="btn-xs btn-ghost" content={sharableContent} />
			</div>
		{/if}
	</div>
</div>
