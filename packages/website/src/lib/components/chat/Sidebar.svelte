<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createChat, deleteChat, getChats } from '$lib/services/chat';
	import type { Chat } from '@core/model';
	import Icon from '@iconify/svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import Moment from 'moment';
	import { SolidLineSpinner } from '../loading';

	export let initChats: Chat[];
	export let activeChatId: string | undefined = undefined;

	let isOpen = false;
	let limit = 5;
	let chats: Chat[] = [];
	let isLoadingInitial = false;
	let isLoadingMore = false;

	const handleCreate = async () => {
		await createChat(
			{
				name: 'New Chat'
			},
			{
				session: $page.data.session
			}
		);
		if (chats.length >= limit) {
			limit++;
		}
	};

	const handleDelete = async (id: string) => {
		if (confirm('Are you sure you want to delete this chat?')) {
			await deleteChat(id, { session: $page.data.session });
			if (activeChatId === id) {
				goto('/chat');
			}
		}
	};

	$: query = createQuery({
		queryKey: ['chats'],
		queryFn: () => getChats({ limit, session: $page.data.session }).then((r) => r.chats),
		initialData: initChats
	});

	$: query?.subscribe(({ data, isLoading, isFetching }) => {
		chats = data ?? [];

		if ((isLoading || isFetching) && chats.length === 0) {
			isLoadingInitial = true;
		} else {
			isLoadingInitial = false;
		}

		if ((isLoading || isFetching) && limit > chats.length) {
			isLoadingMore = true;
		} else {
			isLoadingMore = false;
		}
	});

	$: if ($page.route) isOpen = false;
</script>

<div
	class={`absolute flex h-full max-h-full bg-slate-700 border-t-2 duration-300 z-30 lg:w-1/4 lg:static ${
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
			class={`h-full w-full overflow-y-scroll py-4 px-3 text-white lg:px-6 lg:visible ${
				isOpen ? 'visible' : 'invisible'
			}`}
		>
			<h1 class="px-2 mb-3 text-2xl font-bold">Chat History</h1>
			<div class="flex flex-col content-center w-full space-y-2">
				<div class="flex justify-center w-full">
					<button
						class="flex items-center justify-center w-full py-2 my-2 border rounded-lg hover:bg-slate-900"
						on:click|preventDefault={() => handleCreate()}
					>
						New chat
						<Icon icon="ic:baseline-plus" class="text-xl" />
					</button>
				</div>
				{#if isLoadingInitial}
					<div class="flex justify-center w-full">
						<div class="flex items-center justify-center py-5">
							<SolidLineSpinner size="lg" colorscheme={'light'} />
						</div>
					</div>
				{/if}
				{#if $query.isSuccess}
					{#each chats as chat (chat.id)}
						<div
							class={`flex place-items-center p-2 rounded-lg hover:bg-slate-900 ${
								activeChatId === chat.id ? 'bg-slate-800' : ''
							}`}
						>
							<a href={`/chat/${chat.id}`} class="flex flex-col w-5/6">
								<div class="text-white truncate">{chat.name}</div>
								<div class="text-sm text-gray-400 truncate">
									{Moment(chat.createdAt).format('M/D/YYYY h:mma')}
								</div>
							</a>
							<div class="flex justify-center flex-1">
								<button
									class="flex w-full h-full"
									on:click|preventDefault={() => handleDelete(chat.id)}
								>
									<Icon icon="mdi:trash-outline" class="text-lg hover:text-red-500" />
								</button>
							</div>
						</div>
					{/each}
					{#if !isLoadingMore && chats.length >= limit}
						<button
							class="flex justify-center py-2 text-center border border-white rounded-lg hover:bg-slate-900"
							on:click|preventDefault={() => (limit = limit + 5)}
						>
							View more
						</button>
					{:else if isLoadingMore}
						<div class="flex justify-center w-full">
							<div class="flex items-center justify-center py-5">
								<SolidLineSpinner size="md" colorscheme={'light'} />
							</div>
						</div>
					{/if}
				{:else if $query.isError}
					<div>
						Error fetching devotions: {$query.error}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
