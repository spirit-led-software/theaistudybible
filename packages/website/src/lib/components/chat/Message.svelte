<script lang="ts">
	/* @ts-ignore */
	import { Email, Facebook, Twitter } from 'svelte-share-buttons-component';

	import { PUBLIC_WEBSITE_URL } from '$env/static/public';
	import type { UserWithRoles } from '@core/model';
	import Icon from '@iconify/svelte';
	import type { Message } from 'ai';
	import { Checkbox, Popover, Tooltip } from 'flowbite-svelte';
	import Cross from '../branding/Cross.svelte';
	import Avatar from '../user/Avatar.svelte';
	import CopyButton from './CopyButton.svelte';
	import ResponseSources from './ResponseSources.svelte';

	export let chatId: string | undefined;
	export let message: Message;
	export let prevMessage: Message | undefined;
	export let user: UserWithRoles;

	const url = `${PUBLIC_WEBSITE_URL}/chat`;

	let includePreviousMessage: boolean = false;
	let sharableContent: string = message.content;

	$: ({ id, role, content } = message);

	$: if (includePreviousMessage) {
		sharableContent = `Me: ${prevMessage?.content}\n\nRevelationsAI: ${content}`;
	} else {
		sharableContent = `RevelationsAI: ${content}`;
	}
</script>

<div
	class="flex flex-row items-center w-full px-2 py-4 overflow-x-hidden bg-white border border-t-slate-300"
>
	<div class="flex flex-col content-start w-12">
		{#if role === 'user'}
			<Avatar {user} size="md" class="border shadow-xl border-slate-100" />
		{:else}
			<Cross
				colorscheme="dark"
				size="md"
				class="p-1 border rounded-full shadow-xl border-slate-100"
			/>
		{/if}
	</div>
	<div class="flex flex-col w-full px-3 overflow-x-clip">
		<div class="w-full break-words whitespace-pre-wrap">{content}</div>
		{#if role !== 'user'}
			<div class="flex justify-between w-full place-items-end">
				<ResponseSources aiResponseId={id} {chatId} />
				<div class="flex justify-center space-x-2 place-items-center">
					<CopyButton
						id={`copy-button-${id}`}
						{content}
						class="text-slate-700 hover:text-slate-900"
					/>
					<Popover placement="left-end" triggeredBy={`#share-button-${id}`} trigger="click">
						<div class="flex justify-center mb-2 space-x-2 place-items-center">
							<Email
								class="flex justify-center w-6 h-6 overflow-hidden rounded-full place-items-center"
								subject="Response from RevelationsAI"
								body={`${sharableContent}\n\n${url}`}
							/>
							<Facebook
								class="flex justify-center w-6 h-6 overflow-hidden rounded-full place-items-center"
								{url}
								quote={sharableContent}
							/>
							<Twitter
								class="flex justify-center w-6 h-6 overflow-hidden rounded-full place-items-center"
								text={sharableContent}
								{url}
								hashtags="revelationsai,ai,christ,jesus"
							/>
						</div>
						<div class="flex justify-center space-x-1 place-items-center">
							<label for={`include-previous-${id}`} class="text-xs">Include your message</label>
							<Checkbox id={`include-previous-${id}`} bind:checked={includePreviousMessage} />
						</div>
					</Popover>
					<Tooltip type="dark" placement="top-start" triggeredBy={`#share-button-${id}`}>
						<div class="text-slate-700">Share response</div>
					</Tooltip>
					<button id={`share-button-${id}`} class="text-slate-700 hover:text-slate-900">
						<Icon icon="lucide:share" width={20} height={20} />
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
