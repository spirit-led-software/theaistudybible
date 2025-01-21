import { db } from '@/core/database';
import { DeleteDataSourceButton } from '@/www/components/admin/data-sources/delete-button';
import { EditDataSourceButton } from '@/www/components/admin/data-sources/edit-button';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { DataTable } from '@/www/components/ui/data-table';
import { GET } from '@solidjs/start';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { Pencil, Trash } from 'lucide-solid';
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
  }));

  return (
    <QueryBoundary query={query}>
      {({ pages }) => (
        <div class='flex flex-col gap-4'>
          <DataTable
            columns={[
              { accessorKey: 'id', header: 'ID' },
              { accessorKey: 'name', header: 'Name' },
              { accessorKey: 'type', header: 'Type' },
              {
                accessorKey: 'url',
                header: 'URL',
                cell: (props) => <div class='max-w-40 truncate'>{props.row.getValue('url')}</div>,
              },
              {
                accessorKey: 'id',
                header: 'Actions',
                cell: (props) => (
                  <div class='flex gap-2'>
                    <EditDataSourceButton
                      variant='ghost'
                      size='icon'
                      dataSource={props.row.original}
                      class='size-10'
                    >
                      <Pencil />
                    </EditDataSourceButton>
                    <DeleteDataSourceButton
                      variant='ghost'
                      size='icon'
                      dataSource={props.row.original}
                      class='size-10'
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
