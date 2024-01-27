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
	import { useQueryClient } from '@tanstack/svelte-query';
	import { nanoid, type Message as ChatMessage } from 'ai';
	import { useChat } from 'ai/svelte';
	import { onMount } from 'svelte';
	import IntersectionObserver from 'svelte-intersection-observer';
	import TextAreaAutosize from './TextAreaAutosize.svelte';

	export let initChatId: string | undefined = undefined;
	export let initMessages: RAIChatMessage[] | undefined = undefined;

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
		initialMessages: initMessages,
		sendExtraMessageFields: true,
		onError: (err) => {
			alert = err.message;
		},
		onResponse: (response) => {
			if (response.status === 429) {
				alert = 'You have reached your daily query limit. Upgrade for more!';
			} else if (!response.ok) {
				alert = 'Something went wrong. Please try again.';
			} else {
				chatId = response.headers.get('x-chat-id') ?? undefined;
				lastUserMessageId = response.headers.get('x-user-message-id') ?? undefined;
				lastAiResponseId = response.headers.get('x-ai-response-id') ?? undefined;
				lastModelId = response.headers.get('x-model-id') ?? undefined;
			}
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

	$: handleAiResponse = async (chatMessage: ChatMessage) => {
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
		setMessages(initMessages);
	}

	$: if (!$isLoading && lastChatMessage) handleAiResponse(lastChatMessage);
	$: if (alert) setTimeout(() => (alert = undefined), 8000);

	$: if ($page.url.searchParams.get('query')) {
		handleSearchParamQuery();
	}

	$: userHasPlus = hasPlus($user!) || isAdmin($user!);
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
		<div class="absolute left-0 right-0 top-1 flex justify-center">
			<div class="w-full py-2 overflow-hidden text-center">
				<select
					name="model"
					id="model"
					class="select select-sm bg-slate-700 text-white"
					bind:value={modelId}
					on:change={async (event) => {
						const selectedModelId = event.currentTarget.value;
						if (selectedModelId === 'anthropic.claude-v2:1' && !userHasPlus) {
							await goto('/upgrade');
						}
					}}
				>
					<option disabled>Language Model</option>
					<option value="anthropic.claude-instant-v1">Claude v1</option>
					<option value="anthropic.claude-v2:1" selected={userHasPlus}>Claude v2.1</option>
				</select>
			</div>
		</div>
		{#if $messages && $messages.length > 0}
			<div class="w-full h-full overflow-y-scroll">
				<div class="flex flex-col flex-1 min-h-full place-content-end">
					<div class="h-16 w-full" />
					{#each $messages as message, index}
						<div class="flex flex-col w-full">
							<!-- TODO: Add ads when adsense is approved
                  Randomly show an ad
                  {index !== 0 &&
                    index % Math.floor(Math.random() * 10) === 0 && (
                      <AdMessage />
                    )} -->
							<Message
								{chatId}
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
						<div bind:this={endOfMessagesRef} class="w-full h-20" />
					</IntersectionObserver>
				</div>
			</div>
		{:else}
			<div class="flex justify-center w-full h-full place-items-center justify-items-center">
				<div
					class="flex flex-col w-3/4 px-10 py-5 space-y-2 rounded-lg h-fit bg-slate-200 md:w-1/2"
				>
					<h1 class="self-center text-xl font-medium md:text-2xl">
						Don{`'`}t know where to start?
					</h1>
					<h2 class="self-center text-lg font-medium">Try these:</h2>
					<ul class="list-outside space-y-2">
						{#each starterQueries as query}
							<li>
								<button
									class="flex text-base text-left place-items-center p-2 rounded-xl hover:cursor-pointer hover:bg-slate-300"
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
									<Icon icon="mdi:chevron-right" class="mr-2 text-slate-700 h-6 w-6" />
								</button>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{/if}
		{#if !isEndOfMessagesRefShowing}
			<button
				class="absolute p-2 bg-white rounded-full shadow-lg bottom-16 right-5 text-slate-700 hover:text-slate-900 hover:shadow-xl hover:bg-slate-100"
				on:click|preventDefault={scrollEndIntoView}
			>
				<Icon icon="icon-park:down" class="text-2xl" />
			</button>
		{/if}
		<div class="absolute z-20 overflow-hidden bottom-2 left-5 right-5 opacity-90">
			<form
				class="flex flex-col w-full bg-white border rounded-lg mb-1"
				on:submit|preventDefault={handleSubmitCustom}
			>
				<div class="flex items-center w-full h-auto">
					<Icon icon="icon-park:right" class="mx-1 text-2xl" />
					<TextAreaAutosize {input} />
					<div class="flex mr-2">
						{#if $isLoading}
							<div class="flex mr-1">
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
				<p class="flex-1 text-xs text-gray-400 text-center">
					RevelationsAI can make mistakes. Validate all answers against the bible.
				</p>
			</div>
		</div>
	</div>
</div>
