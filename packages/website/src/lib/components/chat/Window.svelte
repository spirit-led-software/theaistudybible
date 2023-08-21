<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_CHAT_API_URL } from '$env/static/public';
	import Message from '$lib/components/chat/Message.svelte';
	import { updateAiResponse } from '$lib/services/ai-response';
	import type { UserWithRoles } from '@core/model';
	import Icon from '@iconify/svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { nanoid, type Message as ChatMessage } from 'ai';
	import { useChat } from 'ai/svelte';
	import { onMount } from 'svelte';
	import IntersectionObserver from 'svelte-intersection-observer';
	import { LoadingDots } from '../loading';
	import TextAreaAutosize from './TextAreaAutosize.svelte';

	export let user: UserWithRoles;
	export let initChatId: string | undefined = undefined;
	export let initMessages: ChatMessage[] | undefined = undefined;

	let showScrollToBottomButton = false;
	let alert: string | undefined = undefined;
	let chatId: string | undefined = initChatId;
	let lastUserMessageId: string | undefined = undefined;
	let lastAiResponseId: string | undefined = undefined;
	let lastChatMessage: ChatMessage | undefined = undefined;
	let endOfMessagesRef: HTMLDivElement | undefined = undefined;
	let isEndOfMessagesShowing = false;

	const queryClient = useQueryClient();

	onMount(() => {
		const searchParamsQuery = $page.url.searchParams.get('query');
		if (searchParamsQuery) {
			append(
				{
					id: nanoid(),
					content: searchParamsQuery,
					role: 'user'
				},
				{
					options: {
						headers: {
							authorization: `Bearer ${$page.data.session}`
						},
						body: {
							chatId
						}
					}
				}
			);
		}
		endOfMessagesRef?.scrollIntoView({
			behavior: 'instant',
			block: 'end'
		});
	});

	$: ({ input, handleSubmit, messages, append, error, isLoading, reload } = useChat({
		api: PUBLIC_CHAT_API_URL,
		initialMessages: initMessages,
		sendExtraMessageFields: true,
		onResponse: (response) => {
			if (response.status === 429) {
				alert = 'You have reached your daily query limit. Upgrade for more!';
				return;
			} else if (!response.ok) {
				alert = 'Something went wrong. Please try again.';
				return;
			}
			chatId = response.headers.get('x-chat-id') ?? undefined;
			lastUserMessageId = response.headers.get('x-user-message-id') ?? undefined;
			lastAiResponseId = response.headers.get('x-ai-response-id') ?? undefined;
		},
		onFinish: (message: ChatMessage) => {
			lastChatMessage = message;
		}
	}));

	$: scrollEndIntoView = () => {
		if (endOfMessagesRef) {
			endOfMessagesRef.scrollIntoView({
				behavior: 'smooth',
				block: 'end'
			});
		}
	};

	$: messages.subscribe(() => {
		scrollEndIntoView();
	});

	$: error.subscribe((err) => {
		if (err) {
			alert = err.message;
		}
	});

	$: handleSubmitCustom = async (event?: SubmitEvent) => {
		event?.preventDefault();
		if ($input === '') {
			alert = 'Please enter a message';
		}
		await handleSubmit(event, {
			options: {
				headers: {
					authorization: `Bearer ${$page.data.session}`
				},
				body: {
					chatId: chatId
				}
			}
		});
	};

	$: handleReload = async () => {
		await reload({
			options: {
				headers: {
					authorization: `Bearer ${$page.data.session}`
				},
				body: {
					chatId: chatId
				}
			}
		});
		queryClient.invalidateQueries(['chats']);
	};

	$: handleAiResponse = async (chatMessage: ChatMessage) => {
		if (lastAiResponseId) {
			try {
				await updateAiResponse(
					lastAiResponseId,
					{
						aiId: chatMessage.id
					},
					{
						session: $page.data.session
					}
				);
			} catch (err: any) {
				alert = `Something went wrong: ${err.message}`;
			} finally {
				queryClient.invalidateQueries(['chats']);
			}
		}
	};

	$: if (!$isLoading && lastChatMessage) {
		handleAiResponse(lastChatMessage);
	}

	$: showScrollToBottomButton = !isEndOfMessagesShowing;

	$: if (alert) setTimeout(() => (alert = undefined), 8000);
</script>

<div class="absolute w-full h-full overflow-hidden lg:static">
	<div class="relative w-full h-full">
		<div
			role="alert"
			class={`absolute left-0 right-0 flex justify-center duration-300 ${
				alert ? 'scale-100 top-1' : 'scale-0 -top-20'
			}`}
		>
			<div class="w-2/3 py-2 overflow-hidden text-center text-white truncate bg-red-400 rounded-lg">
				{alert}
			</div>
		</div>
		{#if $messages && $messages.length > 0}
			<div class="w-full h-full overflow-y-scroll">
				<div class="flex flex-col flex-1 min-h-full place-content-end">
					{#each $messages as message, index}
						<div class="flex flex-col w-full">
							<!-- TODO: Add ads when adsense is approved
                  Randomly show an ad
                  {index !== 0 &&
                    index % Math.floor(Math.random() * 10) === 0 && (
                      <AdMessage />
                    )} -->
							<Message {user} {chatId} {message} prevMessage={$messages[index - 1]} />
						</div>
					{/each}
					<IntersectionObserver
						element={endOfMessagesRef}
						bind:intersecting={isEndOfMessagesShowing}
					>
						<div bind:this={endOfMessagesRef} class="w-full h-16" />
					</IntersectionObserver>
				</div>
			</div>
		{:else}
			<div class="flex justify-center w-full h-full place-items-center justify-items-center">
				<div
					class="flex flex-col w-3/4 px-10 py-5 space-y-2 rounded-lg h-fit bg-slate-200 md:w-1/2"
				>
					<h1 class="self-center text-xl font-medium md:text-2xl">
						Don{`'`}t know what to say?
					</h1>
					<h2 class="text-lg font-medium">Try asking:</h2>
					<ul class="space-y-1 list-disc list-inside">
						<li>Who is Jesus Christ?</li>
						<li>How does Jesus dying on the cross mean that I can be saved?</li>
						<li>What is the Trinity?</li>
						<li>Can you find me a random Bible verse about grief?</li>
						<li>What does the Bible say about marriage?</li>
					</ul>
				</div>
			</div>
		{/if}
		{#if showScrollToBottomButton}
			<button
				class="absolute p-2 bg-white rounded-full shadow-lg bottom-16 right-5"
				on:click|preventDefault={scrollEndIntoView}
			>
				<Icon icon="icon-park:down" class="text-2xl" />
			</button>
		{/if}
		<div
			class="absolute z-20 overflow-hidden bg-white border rounded-lg bottom-4 left-5 right-5 opacity-90"
		>
			<form class="flex flex-col w-full" on:submit|preventDefault={handleSubmitCustom}>
				<div class="flex items-center w-full mr-1">
					<Icon icon="icon-park:right" class="text-2xl" />
					<TextAreaAutosize id="input" {input} />
					{#if $isLoading}
						<div class="flex mr-1">
							<LoadingDots size={'sm'} />
						</div>
					{/if}
					<button type="button" tabindex={-1} on:click|preventDefault={handleReload}>
						<Icon icon="gg:redo" class="mr-1 text-2xl" />
					</button>
					<button type="submit">
						<Icon icon="majesticons:send-line" class="mr-1 text-2xl" />
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
