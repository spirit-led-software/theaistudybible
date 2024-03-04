<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { session } from '$lib/stores/user';
	import Icon from '@iconify/svelte';
	import { graphql } from '@revelationsai/client/graphql';
	import { rankItem } from '@tanstack/match-sorter-utils';
	import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
	import {
		createSvelteTable,
		flexRender,
		getCoreRowModel,
		getFilteredRowModel,
		getSortedRowModel,
		type ColumnDef,
		type FilterFn,
		type OnChangeFn,
		type PaginationState,
		type SortingState,
		type TableOptions,
		type VisibilityState
	} from '@tanstack/svelte-table';
	import day from 'dayjs';
	import graphqlRequest from 'graphql-request';
	import { derived, writable } from 'svelte/store';
	import type { PageData } from './$types';

	export let data: PageData;

	const pagination = writable<PaginationState>({
		pageIndex: 0,
		pageSize: data.chats.length
	});

	const searchQuery = writable('');

	type ColumnType = NonNullable<NonNullable<typeof $query.data>['chats']>[number];

	const columns: ColumnDef<ColumnType>[] = [
		{
			header: 'Chat',
			columns: [
				{
					accessorKey: 'id',
					header: 'ID',
					cell: (info) => info.getValue(),
					enableHiding: true
				},
				{
					accessorKey: 'name',
					header: 'Name',
					cell: (info) => info.getValue(),
					enableHiding: false
				},
				{
					accessorKey: 'createdAt',
					header: 'Started',
					cell: (info) => day(info.getValue()).format('M/D/YY'),
					enableHiding: true
				},
				{
					accessorKey: 'updatedAt',
					header: 'Updated',
					cell: (info) => day(info.getValue()).format('M/D/YY'),
					enableHiding: true
				}
			],
			enableHiding: false,
			enableSorting: false
		},
		{
			header: 'User',
			columns: [
				{
					accessorKey: 'user.id',
					header: 'ID',
					cell: (info) => info.getValue(),
					enableHiding: true
				},
				{
					accessorKey: 'user.email',
					header: 'Email',
					cell: (info) => info.getValue(),
					enableHiding: false
				},
				{
					accessorKey: 'user.name',
					header: 'Name',
					cell: (info) => info.getValue(),
					enableHiding: true
				}
			],
			enableHiding: false,
			enableSorting: false
		}
	];

	const columnVisibility = writable<VisibilityState>({});

	const setColumnVisibility: OnChangeFn<VisibilityState> = (updater) => {
		if (updater instanceof Function) {
			$columnVisibility = updater($columnVisibility);
		} else {
			$columnVisibility = updater;
		}
		options.update((old) => ({
			...old,
			state: {
				...old.state,
				columnVisibility: $columnVisibility
			}
		}));
	};

	const sorting = writable<SortingState>([
		{
			id: 'updatedAt',
			desc: true
		}
	]);

	const setSorting: OnChangeFn<SortingState> = (updater) => {
		if (updater instanceof Function) {
			$sorting = updater($sorting);
		} else {
			$sorting = updater;
		}
		options.update((old) => ({
			...old,
			state: {
				...old.state,
				sorting: $sorting
			}
		}));
	};

	const filterQuery = writable('');

	const fuzzyFilter: FilterFn<ColumnType> = (row, columnId, value, addMeta) => {
		const itemRank = rankItem(row.getValue(columnId), value);
		addMeta({ itemRank });
		return itemRank.passed;
	};

	const setPagination: OnChangeFn<PaginationState> = (updater) => {
		if (updater instanceof Function) {
			$pagination = updater($pagination);
		} else {
			$pagination = updater;
		}
		options.update((old) => ({
			...old,
			state: {
				...old.state,
				pagination: $pagination
			}
		}));
	};

	const serverSorting = writable<
		| {
				order: 'desc' | 'asc';
				field: string;
		  }[]
		| null
		| undefined
	>(undefined);
	sorting.subscribe((value) => {
		$serverSorting = value
			.filter((sort) => !sort.id.startsWith('user'))
			.map((sort) => ({
				field: sort.id,
				order: sort.desc ? 'desc' : 'asc'
			}));
	});

	const graphqlQuery = graphql(`
		query GetChats($filter: FilterInput, $limit: Int!, $page: Int!, $sort: [SortInput!]) {
			chatCount(filter: $filter)
			chats(filter: $filter, limit: $limit, page: $page, sort: $sort) {
				id
				createdAt
				updatedAt
				name
				user {
					id
					email
					name
				}
			}
		}
	`);
	const query = createQuery(
		derived(
			[pagination, searchQuery, serverSorting],
			([$pagination, $searchQuery, $serverSorting]) => ({
				queryKey: [
					'chats',
					{ pagination: $pagination, searchQuery: $searchQuery, sorting: $serverSorting }
				],
				queryFn: async () => {
					return await graphqlRequest(
						`${PUBLIC_API_URL}/graphql`,
						graphqlQuery,
						{
							filter: $searchQuery
								? {
										OR: [
											{
												iLike: {
													column: 'name',
													placeholder: `%${$searchQuery}%`
												}
											}
										]
									}
								: undefined,
							limit: $pagination.pageSize,
							page: $pagination.pageIndex + 1,
							sort: $serverSorting
						},
						{
							authorization: `Bearer ${$session}`
						}
					);
				},
				placeholderData: keepPreviousData,
				initialData: {
					chats: data.chats,
					chatCount: data.chatCount
				}
			})
		)
	);

	const options = writable<TableOptions<ColumnType>>({
		data: $query.data?.chats ?? [],
		rowCount: $query.data?.chatCount ?? 0,
		columns,
		state: {
			sorting: $sorting,
			pagination: $pagination,
			columnVisibility: $columnVisibility
		},
		filterFns: {
			fuzzy: fuzzyFilter
		},
		globalFilterFn: fuzzyFilter,
		enableMultiSort: true,
		enableMultiRowSelection: true,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: setPagination,
		onColumnVisibilityChange: setColumnVisibility,
		manualPagination: true
	});
	query.subscribe(({ data }) => {
		if (data) {
			options.update((old) => ({
				...old,
				data: data.chats ?? [],
				rowCount: data.chatCount ?? 0
			}));
		}
	});

	const table = createSvelteTable(derived(options, ($options) => $options));

	filterQuery.subscribe((value) => {
		$table.setGlobalFilter(value);
	});

	const reset = () => {
		$table.resetColumnVisibility();
		$table.resetSorting();
		$table.resetGlobalFilter();
		$filterQuery = '';
	};
</script>

<div class="flex w-full flex-col overflow-auto p-2">
	<div class="flex w-full justify-between">
		<div class="flex place-items-center space-x-2">
			<h2 class="flex px-2 py-1 text-center text-xl font-bold">Chats</h2>
			{#if $query.isFetching}
				<span class="loading loading-sm loading-spinner" />
			{/if}
		</div>
		<input
			class="input input-bordered w-1/2"
			type="text"
			placeholder="Search"
			bind:value={$searchQuery}
		/>
	</div>
	{#if $query.data?.chats && $query.data?.chats.length > 0}
		<div class="h-full w-full overflow-auto">
			<table class="table-sm table">
				<thead>
					{#each $table.getHeaderGroups() as headerGroup}
						<tr>
							{#each headerGroup.headers as header}
								<th colspan={header.colSpan}>
									{#if !header.isPlaceholder}
										<button
											class="flex place-items-center justify-center"
											class:cursor-pointer={header.column.getCanSort()}
											class:select-none={header.column.getCanSort()}
											on:click={header.column.getToggleSortingHandler()}
										>
											<svelte:component
												this={flexRender(header.column.columnDef.header, header.getContext())}
											/>
											{#if header.column.getCanHide()}
												<button on:click={header.column.getToggleVisibilityHandler()}>
													<Icon
														icon={header.column.getIsVisible() ? 'mdi:eye' : 'mdi:eye-off'}
														class="ml-2 h-3 w-3"
													/>
												</button>
											{/if}
											{#if header.column.getIsSorted()}
												<Icon
													icon={`bxs:${header.column.getIsSorted().toString() === 'asc' ? 'up' : 'down'}-arrow`}
													class="ml-2 h-2 w-2"
												/>
											{/if}
										</button>
									{/if}
								</th>
							{/each}
						</tr>
					{/each}
				</thead>
				<tbody>
					{#each $table.getRowModel().rows as row}
						<tr
							class="cursor-pointer"
							on:click={async () => {
								await goto(`/admin/chats/${$query.data.chats[row.index].id}`);
							}}
						>
							{#each row.getVisibleCells() as cell}
								<td>
									<svelte:component
										this={flexRender(cell.column.columnDef.cell, cell.getContext())}
										class="table-cell"
									/>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="flex items-center justify-between space-x-2">
			<input
				class="input input-bordered flex-1"
				type="text"
				placeholder="Filter"
				bind:value={$filterQuery}
				disabled={!(($query.data?.chats?.length ?? 0) > 0)}
			/>
			<div class="flex space-x-2">
				<button class="btn" on:click={reset}> Reset </button>
				<button
					class="btn"
					on:click={() => $table.firstPage()}
					disabled={!$table.getCanPreviousPage()}
				>
					First
				</button>
				<button
					class="btn"
					on:click={() => $table.previousPage()}
					disabled={!$table.getCanPreviousPage()}
				>
					Previous
				</button>
				<button class="btn" on:click={() => $table.nextPage()} disabled={!$table.getCanNextPage()}>
					Next
				</button>
				<button class="btn" on:click={() => $table.lastPage()} disabled={!$table.getCanNextPage()}>
					Last
				</button>
			</div>
		</div>
	{:else if $query.isFetching}
		<div class="flex h-52 flex-col place-items-center justify-center">
			<span class="loading loading-spinner" />
		</div>
	{:else if $query.isError}
		<div class="flex h-52 flex-col place-items-center justify-center">
			<span class="text-red-500">Error loading chats</span>
			<button class="btn" on:click={() => $query.refetch()}>Retry</button>
		</div>
	{:else}
		<div class="flex h-52 flex-col place-items-center justify-center">
			<span class="text-red-500">No chats found</span>
		</div>
	{/if}
</div>
