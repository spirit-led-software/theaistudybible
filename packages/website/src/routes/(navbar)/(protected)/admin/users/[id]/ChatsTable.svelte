<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { session, user } from '$lib/stores/user';
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

	export let userId: string = $user!.id;
	let paginationInput: PaginationState = {
		pageIndex: 0,
		pageSize: 5
	};
	export { paginationInput as pagination };

	const pagination = writable<PaginationState>(paginationInput);
	$: pagination.set(paginationInput);

	const searchQuery = writable('');

	const graphqlQuery = graphql(/* GraphQL */ `
		query UserChats($userId: String!, $limit: Int!, $page: Int!) {
			user(id: $userId) {
				chatCount
				chats(limit: $limit, page: $page) {
					id
					updatedAt
					name
				}
			}
		}
	`);

	const query = createQuery(
		derived([pagination], ([$pagination]) => ({
			queryKey: ['user-chats', { pagination: $pagination, userId }],
			queryFn: async () => {
				return await graphqlRequest(
					`${PUBLIC_API_URL}/graphql`,
					graphqlQuery,
					{
						userId,
						limit: $pagination.pageSize,
						page: $pagination.pageIndex + 1
					},
					{
						authorization: `Bearer ${$session}`
					}
				);
			},
			placeholderData: keepPreviousData
		}))
	);

	type ColumnType = NonNullable<
		NonNullable<NonNullable<typeof $query.data>['user']>['chats']
	>[number];

	const columns: ColumnDef<ColumnType>[] = [
		{
			accessorKey: 'name',
			header: 'Name',
			cell: (info) => info.getValue(),
			enableHiding: false
		},
		{
			accessorFn: (row) => day(row.updatedAt).format('M/D/YY'),
			id: 'updatedAt',
			header: 'Updated',
			cell: (info) => info.getValue(),
			enableHiding: true
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

	const sorting = writable<SortingState>([]);

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

	const options = writable<TableOptions<ColumnType>>({
		data: $query.data?.user?.chats ?? [],
		columns,
		rowCount: $query.data?.user?.chatCount ?? 0,
		state: {
			sorting: $sorting,
			pagination: $pagination,
			columnVisibility: $columnVisibility
		},
		filterFns: {
			fuzzy: fuzzyFilter
		},
		globalFilterFn: fuzzyFilter,
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
				data: data.user?.chats ?? [],
				rowCount: data.user?.chatCount ?? 0
			}));
		}
	});

	const table = createSvelteTable(derived(options, ($options) => $options));

	searchQuery.subscribe((value) => {
		$table.setGlobalFilter(value);
	});

	const reset = () => {
		$table.resetColumnVisibility();
		$table.resetSorting();
		$table.resetGlobalFilter();
		$searchQuery = '';
	};
</script>

<div class="flex w-full flex-col overflow-auto p-2">
	<div class="flex w-full justify-between">
		<h2 class="flex w-full px-2 py-1 text-center text-xl font-bold">Chats</h2>
		<input
			class="w-2/3 rounded-md border border-gray-300 px-2 py-1 text-sm"
			type="text"
			placeholder="Filter"
			bind:value={$searchQuery}
			disabled={!(($query.data?.user?.chats?.length ?? 0) > 0)}
		/>
	</div>
	{#if $query.data?.user?.chats && $query.data?.user?.chats.length > 0}
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
							// @ts-expect-error - We know this is a string
							await goto(`/admin/chats/${$query.data.user.chats[row.index].id}`);
						}}
					>
						{#each row.getVisibleCells() as cell}
							<td>
								<svelte:component
									this={flexRender(cell.column.columnDef.cell, cell.getContext())}
								/>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
		<div class="mt-2 flex items-center justify-end gap-2">
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
