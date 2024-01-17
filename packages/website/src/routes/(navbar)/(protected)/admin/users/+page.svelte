<script lang="ts">
	import { searchForUsers } from '$lib/services/user';
	import { session } from '$lib/stores/user';
	import type { Query } from '@core/database/helpers';
	import type { User } from '@core/model/user';
	import { createInfiniteQuery } from '@tanstack/svelte-query';
	import type { SvelteComponent } from 'svelte';
	import { derived, writable } from 'svelte/store';
	import type { PageData } from './$types';
	import CreateDialog from './CreateDialog.svelte';
	import UserRow from './UserRow.svelte';

	export let data: PageData;

	let createDialog: SvelteComponent | undefined = undefined;
	let users: User[] = [];

	const queryString = writable('');

	const query = createInfiniteQuery(
		derived(queryString, ($queryString) => ({
			queryKey: ['infinite-users', $queryString],
			queryFn: async ({ pageParam = 1 }) => {
				let searchQuery: Query = {};
				if ($queryString) {
					searchQuery = {
						OR: [
							{
								iLike: {
									column: 'name',
									placeholder: `%${$queryString}%`
								}
							},
							{
								iLike: {
									column: 'email',
									placeholder: `%${$queryString}%`
								}
							}
						]
					};
				}
				return await searchForUsers({
					limit: data.limit,
					page: pageParam,
					session: $session!,
					query: searchQuery
				}).then((r) => r.users);
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage: User[], pages: User[][]) => {
				if (lastPage.length < data.limit) return undefined;
				return pages.length + 1;
			},
			initialData: {
				pages: [data.users],
				pageParams: [1]
			}
		}))
	);
	query.subscribe(({ data, isSuccess }) => {
		if (isSuccess) {
			users = data.pages.flat();
		}
	});
</script>

<svelte:head>
	<title>RevelationsAI Users</title>
</svelte:head>

<div class="flex flex-col w-full h-full p-5 space-y-5">
	<div class="flex w-full justify-between">
		<div class="flex space-x-2 place-items-center">
			<h1 class="text-2xl font-medium">Users</h1>
			<button
				class="text-white btn btn-circle btn-xs bg-slate-700 hover:bg-slate-900"
				on:click={() => createDialog?.show()}>+</button
			>
			<CreateDialog bind:this={createDialog} />
		</div>
		<div class="flex place-items-center">
			<input
				type="text"
				class="input input-primary input-sm"
				placeholder="Search"
				bind:value={$queryString}
			/>
		</div>
	</div>
	<div class="w-full h-full overflow-auto">
		<table class="table whitespace-normal table-xs">
			<thead>
				<tr>
					<th />
					<th>ID</th>
					<th>Name</th>
					<th>Email</th>
					<th>Roles</th>
					<th>Joined</th>
				</tr>
			</thead>
			<tbody>
				{#each users as user (user.id)}
					<UserRow {user} />
				{/each}
				{#if $query.hasNextPage}
					<tr>
						<td colspan="7">
							<button
								class="w-full btn btn-ghost"
								on:click={() => {
									$query.fetchNextPage();
								}}
							>
								Load More
							</button>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
