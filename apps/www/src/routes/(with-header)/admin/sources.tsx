import { db } from '@/core/database';
import { DeleteDataSourceButton } from '@/www/components/admin/data-sources/delete-button';
import { EditDataSourceButton } from '@/www/components/admin/data-sources/edit-button';
import { SyncDataSourceButton } from '@/www/components/admin/data-sources/sync-button';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { DataTable } from '@/www/components/ui/data-table';
import { GET } from '@solidjs/start';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { formatDate } from 'date-fns';
import { Pencil, RefreshCw, Trash } from 'lucide-solid';
import { Show } from 'solid-js';

const getSources = GET(async (input: { offset: number; limit: number }) => {
  'use server';
  const sources = await db.query.dataSources.findMany({
    offset: input.offset,
    limit: input.limit,
  });
  return {
    sources,
    nextCursor: sources.length === input.limit ? input.offset + input.limit : undefined,
  };
});

const SourcesPage = () => {
  const query = createInfiniteQuery(() => ({
    queryKey: ['data-sources'],
    queryFn: ({ pageParam }) => getSources({ offset: pageParam ?? 0, limit: 10 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    refetchInterval: 10000,
  }));

  return (
    <QueryBoundary query={query}>
      {({ pages }) => (
        <div class='flex flex-col gap-4'>
          <DataTable
            columns={[
              { accessorKey: 'id', header: 'ID' },
              { accessorKey: 'type', header: 'Type' },
              { accessorKey: 'name', header: 'Name' },
              {
                accessorKey: 'url',
                header: 'URL',
                cell: (props) => <div class='max-w-52 truncate'>{props.row.getValue('url')}</div>,
              },
              {
                accessorKey: 'syncSchedule',
                header: 'Sync Schedule',
              },
              {
                accessorKey: 'numberOfDocuments',
                header: 'Sync Status',
              },
              {
                accessorKey: 'lastManualSync',
                header: 'Last Manual Sync',
                cell: (props) =>
                  props.row.getValue('lastManualSync')
                    ? formatDate(props.row.getValue('lastManualSync'), 'MM/dd/yyyy hh:mm a')
                    : 'N/A',
              },
              {
                accessorKey: 'lastAutomaticSync',
                header: 'Last Automatic Sync',
                cell: (props) =>
                  props.row.getValue('lastAutomaticSync')
                    ? formatDate(props.row.getValue('lastAutomaticSync'), 'MM/dd/yyyy hh:mm a')
                    : 'N/A',
              },
              {
                accessorKey: 'id',
                header: 'Actions',
                cell: (props) => (
                  <div class='flex gap-1'>
                    <SyncDataSourceButton
                      variant='ghost'
                      size='icon'
                      dataSource={props.row.original}
                      class='size-8'
                    >
                      <RefreshCw />
                    </SyncDataSourceButton>
                    <EditDataSourceButton
                      variant='ghost'
                      size='icon'
                      dataSource={props.row.original}
                      class='size-8'
                    >
                      <Pencil />
                    </EditDataSourceButton>
                    <DeleteDataSourceButton
                      variant='ghost'
                      size='icon'
                      dataSource={props.row.original}
                      class='size-8'
                    >
                      <Trash />
                    </DeleteDataSourceButton>
                  </div>
                ),
              },
            ]}
            data={pages.flatMap((page) => page.sources)}
          />
          <Show when={query.hasNextPage}>
            <Button onClick={() => query.fetchNextPage()}>Load more</Button>
          </Show>
        </div>
      )}
    </QueryBoundary>
  );
};

export default SourcesPage;
