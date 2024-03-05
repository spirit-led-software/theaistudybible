<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_API_URL } from '$env/static/public';
	import Avatar from '$lib/components/user/Avatar.svelte';
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
		pageSize: data.users.length
	});

	const searchQuery = writable('');

	type ColumnType = NonNullable<NonNullable<typeof $query.data>['users']>[number];

	const columns: ColumnDef<ColumnType>[] = [
		{
			accessorKey: 'id',
			header: 'ID',
			cell: (info) => info.getValue(),
			enableHiding: true
		},
		{
			accessorKey: 'email',
			header: 'Email',
			cell: (info) => info.getValue(),
			enableHiding: false
		},
		{
			accessorKey: 'name',
			header: 'Name',
			cell: (info) => info.getValue(),
			enableHiding: true
		},
		{
			accessorKey: 'lastSeenAt',
			header: 'Last Seen',
			cell: (info) => (info.getValue() ? day(info.getValue() as Date).format('M/D/YY') : undefined),
			enableHiding: true
		},
		{
			header: 'Joined',
			accessorFn: (row) => day(row.createdAt as Date).format('M/D/YY'),
			id: 'createdAt',
			enableHiding: true
		},
		{
			header: 'Roles',
			accessorFn: (row) => row.roles?.map((role) => role.name).join(', ') ?? 'N/A',
			id: 'roles',
			enableHiding: false,
			enableSorting: true
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
			id: 'createdAt',
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
			.filter((sort) => !sort.id.startsWith('roles'))
			.map((sort) => ({
				field: sort.id,
				order: sort.desc ? 'desc' : 'asc'
			}));
	});

	const graphqlQuery = graphql(`
		query GetUsers($filter: FilterInput, $limit: Int!, $page: Int!, $sort: [SortInput!]) {
			userCount(filter: $filter)
			users(filter: $filter, limit: $limit, page: $page, sort: $sort) {
				id
				image
				email
				name
				createdAt
				updatedAt
				lastSeenAt
				roles {
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
					'users',
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
											},
											{
												iLike: {
													column: 'email',
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
					users: data.users.map((user) => ({
						...user,
						roles: user.usersToRoles.map((userToRole) => userToRole.role)
					})),
					userCount: data.userCount
				}
			})
		)
	);

	const options = writable<TableOptions<ColumnType>>({
		data: $query.data?.users ?? [],
		rowCount: $query.data?.userCount ?? 0,
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
				data: data.users ?? [],
				rowCount: data.userCount ?? 0
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
			<h2 class="flex px-2 py-1 text-center text-xl font-bold">Users</h2>
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
	{#if $query.data?.users && $query.data?.users.length > 0}
		<div class="h-full w-full overflow-auto">
			<table class="table-sm table">
				<thead>
					{#each $table.getHeaderGroups() as headerGroup}
						<tr>
							<th />
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
							on:click={async () => await goto(`/admin/users/${$query.data.users[row.index].id}`)}
						>
							<td>
								<Avatar user={$query.data.users[row.index]} />
							</td>
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
			<div class="flex items-center justify-between space-x-2">
				<input
					class="input input-bordered flex-1"
					type="text"
					placeholder="Filter"
					bind:value={$filterQuery}
					disabled={!(($query.data?.users?.length ?? 0) > 0)}
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
					<button
						class="btn"
						on:click={() => $table.nextPage()}
						disabled={!$table.getCanNextPage()}
					>
						Next
					</button>
					<button
						class="btn"
						on:click={() => $table.lastPage()}
						disabled={!$table.getCanNextPage()}
					>
						Last
					</button>
				</div>
			</div>
		</div>
	{:else if $query.isFetching}
		<div class="flex h-52 flex-col place-items-center justify-center">
			<span class="loading loading-spinner" />
		</div>
	{:else if $query.isError}
		<div class="flex h-52 flex-col place-items-center justify-center">
			<span class="text-red-500">Error loading users</span>
			<button class="btn" on:click={() => $query.refetch()}>Retry</button>
		</div>
	{:else}
		<div class="flex h-52 flex-col place-items-center justify-center">
			<span class="text-red-500">No users found</span>
		</div>
	{/if}
</div>
