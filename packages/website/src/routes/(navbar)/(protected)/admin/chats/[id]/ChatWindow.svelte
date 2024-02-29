<script lang="ts">
	import Message from '$lib/components/chat/Message.svelte';
	import Icon from '@iconify/svelte';
	import type { Chat } from '@revelationsai/core/model/chat';
	import type { RAIChatMessage } from '@revelationsai/core/model/chat/message';
	import type { ModelInfo } from '@revelationsai/core/model/llm';
	import type { User } from '@revelationsai/core/model/user';
	import { onMount } from 'svelte';
	import IntersectionObserver from 'svelte-intersection-observer';
	import { writable } from 'svelte/store';

	export let user: User | undefined = undefined;
	export let modelInfos: { [k: string]: ModelInfo } = {};

	let chatInput: Chat | undefined = undefined;
	export { chatInput as chat };

	let messagesInput: RAIChatMessage[] = [];
	export { messagesInput as messages };

	const chat = writable<Chat | undefined>(chatInput);
	$: chat.set(chatInput);

	const messages = writable<RAIChatMessage[]>(messagesInput);
	$: messages.set(messagesInput);

	let alert: string | undefined = undefined;
	let endOfMessagesRef: HTMLDivElement | undefined;
	let isEndOfMessagesRefShowing = true;

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
		{#if $messages && $messages.length > 0}
			<div class="h-full w-full overflow-y-scroll">
				<div class="flex min-h-full flex-1 flex-col place-content-end">
					<div class="h-16 w-full" />
					{#each $messages as message, index}
						<div class="flex w-full flex-col">
							<Message
								{user}
								{modelInfos}
								{message}
								prevMessage={$messages[index - 1]}
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
				No messages found
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
	</div>
</div>
