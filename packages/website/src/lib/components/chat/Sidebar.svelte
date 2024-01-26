<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { session } from '$lib/stores/user';
	import Icon from '@iconify/svelte';
	import {
		createChat,
		deleteChat,
		searchForChats,
		updateChat
	} from '@revelationsai/client/services/chat';
	import type { Query } from '@revelationsai/core/database/helpers';
	import type { Chat } from '@revelationsai/core/model/chat';
	import {
		createInfiniteQuery,
		createMutation,
		useQueryClient,
		type InfiniteData
	} from '@tanstack/svelte-query';
	import Day from 'dayjs';
	import { derived, writable } from 'svelte/store';

	export let initChats: Chat[] = [];
	export let activeChatId: string | undefined = undefined;

	let isOpen = false;
	let loadingChatId: string | undefined = undefined;
	let editChatId: string | undefined = undefined;
	let editChatInput: HTMLInputElement | undefined = undefined;
	let editChatForm: HTMLFormElement | undefined = undefined;
	let chats: Chat[] = initChats;

	const queryString = writable('');

	const client = useQueryClient();

	const handleCreate = async () => {
		return await createChat(
			{
				name: 'New Chat'
			},
			{
				session: $session!
			}
		);
	};

	const createChatMutation = createMutation(
		derived(queryString, ($queryString) => ({
			mutationFn: handleCreate,
			onMutate: async () => {
				await client.cancelQueries({ queryKey: ['infinite-chats', $queryString] });
				const previousChats = client.getQueryData<InfiniteData<Chat[]>>([
					'infinite-chats',
					$queryString
				]);
				if (previousChats) {
					client.setQueryData<InfiniteData<Chat[]>>(['infinite-chats', $queryString], {
						pages: [
							[
								{
									id: 'new',
									name: 'New Chat',
									createdAt: new Date(),
									updatedAt: new Date(),
									userId: $page.data.user.id,
									customName: false
								},
								...previousChats.pages[0]
							],
							...previousChats.pages.slice(1)
						],
						pageParams: previousChats.pageParams
					});
				}
				return { previousChats };
			},
			onSettled: () => {
				client.invalidateQueries({ queryKey: ['infinite-chats', $queryString] });
			}
		}))
	);

	const handleSubmitCreate = () => {
		$createChatMutation.mutate();
	};

	const handleUpdate = async ({ name, id }: { name: string; id: string }) => {
		return await updateChat(
			id,
			{
				name: name
			},
			{
				session: $session!
			}
		);
	};

	const editChatMutation = createMutation(
		derived(queryString, ($queryString) => ({
			mutationFn: handleUpdate,
			onMutate: async ({ name, id }: { name: string; id: string }) => {
				await client.cancelQueries({ queryKey: ['infinite-chats', $queryString] });
				const previousChats = client.getQueryData<InfiniteData<Chat[]>>([
					'infinite-chats',
					$queryString
				]);
				if (previousChats) {
					client.setQueryData<InfiniteData<Chat[]>>(['infinite-chats', $queryString], {
						pages: previousChats.pages.map((page) =>
							page.map((c) => (c.id === id ? { ...c, name } : c))
						),
						pageParams: previousChats.pageParams
					});
				}
				return { previousChats };
			},
			onSettled: () => {
				client.invalidateQueries({ queryKey: ['infinite-chats'] });
			}
		}))
	);

	const handleSubmitEdit = async (
		event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement },
		id: string
	) => {
		const formData = new FormData(event.currentTarget);
		const name = formData.get('name') as string;
		if (!name) {
			return;
		}
		$editChatMutation.mutate({ name, id });
		editChatId = undefined;
	};

	const handleDelete = async (id: string) => {
		await deleteChat(id, { session: $session! }).finally(async () => {
			if (activeChatId === id) await goto('/chat');
		});
	};

	const deleteChatMutation = createMutation(
		derived(queryString, ($queryString) => ({
			mutationFn: handleDelete,
			onMutate: async (id: string) => {
				await client.cancelQueries({ queryKey: ['infinite-chats', $queryString] });
				const previousChats = client.getQueryData<InfiniteData<Chat[]>>(['infinite-chats']);
				if (previousChats) {
					client.setQueryData<InfiniteData<Chat[]>>(['infinite-chats', $queryString], {
						pages: previousChats.pages.map((page) => page.filter((c) => c.id !== id)),
						pageParams: previousChats.pageParams
					});
				}
				return { previousChats };
			},
			onSettled: async () => {
				client.invalidateQueries({ queryKey: ['infinite-chats', $queryString] });
			}
		}))
	);

	const handleSubmitDelete = async (id: string) => {
		if (confirm('Are you sure you want to delete this chat?')) {
			$deleteChatMutation.mutate(id);
			if (activeChatId === id) {
				await goto('/chat');
			}
		}
	};

	const query = createInfiniteQuery(
		derived(queryString, ($queryString) => {
			return {
				queryKey: ['infinite-chats', $queryString],
				queryFn: async ({ pageParam }: { pageParam: number }): Promise<Chat[]> => {
					let searchQuery: Query = {};
					if ($queryString) {
						searchQuery = {
							iLike: {
								column: 'name',
								placeholder: `%${$queryString}%`
							}
						};
					}
					return await searchForChats({
						limit: 7,
						page: pageParam,
						orderBy: 'updatedAt',
						order: 'desc',
						query: searchQuery,
						session: $session!
					}).then((r) => r.chats);
				},
				getNextPageParam: (lastPage: Chat[], pages: Chat[][]) => {
					if (lastPage.length < 7) return undefined;
					return pages.length + 1;
				},
				initialPageParam: 1,
				initialData: {
					pages: [chats],
					pageParams: [1]
				}
			};
		})
	);
	query.subscribe(({ data, isSuccess }) => {
		if (isSuccess) {
			chats = data.pages.flat();
		}
	});

	$: if ($page.url.pathname) {
		isOpen = false;
		loadingChatId = undefined;
	}

	$: if (loadingChatId) activeChatId = loadingChatId;
</script>

<nav
	class={`absolute flex flex-grow-0 flex-shrink-0 h-full bg-slate-700 border-t-2 duration-300 z-30 lg:w-1/4 lg:static ${
		isOpen ? 'w-full' : 'w-0'
	}`}
>
	<div class="relative flex flex-col w-full h-full">
		<button
			class={`absolute top-2 p-1 z-40 rounded-full bg-white border border-slate-700 cursor-pointer duration-300 lg:hidden ${
				isOpen ? 'rotate-0 right-2' : 'rotate-180 -right-10 opacity-75'
			}`}
			on:click|preventDefault={() => (isOpen = !isOpen)}
		>
			<Icon icon="formkit:arrowleft" height={20} width={20} />
		</button>
		<div
			class={`h-full w-full py-4 px-6 overflow-y-auto text-white lg:px-2 lg:visible ${
				isOpen ? 'visible' : 'invisible'
			}`}
		>
			<h1 class="px-2 mb-3 text-2xl font-medium">Chat History</h1>
			<div class="flex flex-col content-center w-full space-y-1">
				<div class="flex justify-center w-full">
					<button
						class="flex items-center justify-center w-full py-2 my-2 border rounded-lg hover:bg-slate-900 active:bg-slate-900"
						on:click|preventDefault={() => handleSubmitCreate()}
					>
						New chat
						<Icon icon="ic:baseline-plus" class="text-xl" />
					</button>
				</div>
				{#if $query.isLoading}
					<div class="flex justify-center w-full">
						<div class="flex items-center justify-center py-5">
							<span class="loading loading-spinner loading-lg" />
						</div>
					</div>
				{:else}
					<div
						class="flex justify-center place-items-center w-full px-2 py-1 bg-slate-800 rounded-lg"
					>
						<Icon icon="mdi:magnify" height={20} width={20} />
						<input
							id="search"
							name="search"
							class="flex-1 py-1 px-2 bg-transparent rounded-lg focus:ring-0 focus:border-none focus:outline-none"
							placeholder="Search chats"
							autocomplete="off"
							bind:value={$queryString}
						/>
						{#if $queryString}
							<button
								class="hover:text-red-500"
								on:click|preventDefault={() => ($queryString = '')}
							>
								<Icon icon="pajamas:clear" height={15} width={15} />
							</button>
						{/if}
					</div>
				{/if}
				{#each chats as chat (chat.id)}
					<div
						class={`flex w-full place-items-center justify-between px-4 py-2 rounded-lg truncate cursor-pointer hover:bg-slate-900 active:bg-slate-900 ${
							activeChatId === chat.id ? 'bg-slate-800' : ''
						}`}
					>
						<button
							class="flex flex-col flex-1 text-left truncate hover:text-pretty"
							on:click|preventDefault={async () => {
								if (editChatId === chat.id) {
									editChatInput?.focus();
								} else if (activeChatId === chat.id) {
									isOpen = false;
								} else {
									loadingChatId = chat.id;
									await goto(`/chat/${chat.id}`, { replaceState: true });
								}
							}}
						>
							{#if editChatId === chat.id}
								<form
									bind:this={editChatForm}
									on:submit|preventDefault={(event) => handleSubmitEdit(event, chat.id)}
									class="flex flex-col w-full"
								>
									<input
										bind:this={editChatInput}
										name="name"
										class="w-full py-1 bg-transparent rounded-lg focus:ring-0 focus:border-none focus:outline-none"
										autocomplete="off"
									/>
								</form>
							{:else}
								<h2 class="text-base">{chat.name}</h2>
							{/if}
							<div class="text-sm text-gray-400">
								{Day(chat.createdAt).format('M/D/YYYY h:mma')}
							</div>
						</button>
						<div class="flex justify-center space-x-1 place-items-center">
							{#if loadingChatId === chat.id}
								<div class="mr-2">
									<span class="loading loading-spinner loading-xs" />
								</div>
							{:else if editChatId === chat.id}
								<button
									class="flex w-full h-full"
									on:click|preventDefault={() => {
										editChatForm?.dispatchEvent(new Event('submit'));
									}}
								>
									<Icon
										icon={'material-symbols:check'}
										width={20}
										height={20}
										class="hover:text-green-500 active:text-green-500"
									/>
								</button>
								<button
									class="flex w-full h-full"
									on:click|preventDefault={() => {
										editChatId = undefined;
										editChatForm = undefined;
									}}
								>
									<Icon
										icon="cil:x"
										width={20}
										height={20}
										class="hover:text-red-500 active:text-red-500"
									/>
								</button>
							{:else}
								<button
									class="flex w-full h-full"
									on:click={() => {
										editChatId = chat.id;
									}}
								>
									<Icon
										icon={'tdesign:edit'}
										width={20}
										height={20}
										class="hover:text-yellow-400 active:text-yellow-400"
									/>
								</button>
								<button
									class="flex w-full h-full"
									on:click|preventDefault={() => handleSubmitDelete(chat.id)}
								>
									<Icon
										icon="mdi:trash-outline"
										width={20}
										height={20}
										class="hover:text-red-500 active:text-red-500"
									/>
								</button>
							{/if}
						</div>
					</div>
				{/each}
				{#if $query.hasNextPage && !$query.isFetchingNextPage}
					<button
						class="flex justify-center py-2 text-center border border-white rounded-lg hover:bg-slate-900 active:bg-slate-900"
						on:click|preventDefault={() => $query.fetchNextPage()}
					>
						View more
					</button>
				{:else if $query.isFetchingNextPage}
					<div class="flex justify-center w-full">
						<div class="flex items-center justify-center py-5">
							<span class="loading loading-spinner loading-md" />
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</nav>
