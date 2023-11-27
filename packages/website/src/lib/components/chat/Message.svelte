<script lang="ts">
	// @ts-ignore
	import Email from 'svelte-share-buttons-component/src/Email.svelte';
	// @ts-ignore
	import Facebook from 'svelte-share-buttons-component/src/Facebook.svelte';
	// @ts-ignore
	import Twitter from 'svelte-share-buttons-component/src/Twitter.svelte';

	import { PUBLIC_WEBSITE_URL } from '$env/static/public';
	import { cn } from '$lib/utils/class-names';
	import { squareDimensionClasses } from '$lib/utils/sizing';
	import Icon from '@iconify/svelte';
	import type { Message } from 'ai';
	import Moment from 'moment';
	import CompactLogo from '../branding/CompactLogo.svelte';
	import Avatar from '../user/Avatar.svelte';
	import CopyButton from './CopyButton.svelte';
	import MessageMarkdown from './MessageMarkdown.svelte';
	import ResponseSources from './ResponseSources.svelte';

	export let chatId: string | undefined;
	export let message: Message;
	export let prevMessage: Message | undefined = undefined;
	export let isChatLoading = false;
	export let isLastMessage = false;

	const url = `${PUBLIC_WEBSITE_URL}/chat`;

	let includePreviousMessage: boolean = false;
	let sharableContent: string = message.content;
	let shareModal: HTMLDialogElement | undefined = undefined;

	let id: string;
	let role: Message['role'];
	let content: string;

	$: ({ id, role, content } = message);

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
			<div
				class={cn(
					squareDimensionClasses['lg'],
					'overflow-hidden p-1 rounded-full bg-slate-700 shadow-xl border border-slate-100'
				)}
			>
				<div class="flex justify-center w-full h-full place-items-center">
					<CompactLogo colorscheme="light" size="xl" />
				</div>
			</div>
		{/if}
	</div>
	<div class="flex flex-col w-full px-3 overflow-x-clip">
		<MessageMarkdown {content} />
		<div class="flex justify-end w-full mt-2 text-xs text-gray-400">
			{Moment(message.createdAt).format('MMMM Do YYYY h:mm a')}
		</div>
		{#if role !== 'user' && !(isLastMessage && isChatLoading)}
			<div class="flex justify-between w-full place-items-end">
				<ResponseSources aiResponseId={id} {chatId} {isChatLoading} />
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
								<Twitter
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
