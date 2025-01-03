import { db } from '@/core/database';
import { toTitleCase } from '@/core/utils/string';
import { cn } from '@/www/lib/utils';
import { useNavigate } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { formatDate } from 'date-fns';
import { History, X } from 'lucide-solid';
import { For, Show, createEffect } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { useDevotionStore } from '../../contexts/devotion';
import { QueryBoundary } from '../query-boundary';
import { Button, buttonVariants } from '../ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { H6 } from '../ui/typography';

const getDevotions = GET(async ({ offset, limit }: { offset: number; limit: number }) => {
  'use server';
  const devotions = await db.query.devotions.findMany({
    orderBy: (devotions, { desc }) => desc(devotions.createdAt),
    offset,
    limit,
  });
  return {
    devotions,
    nextCursor: devotions.length === limit ? offset + devotions.length : undefined,
  };
});

export const getDevotionsQueryOptions = () => ({
  queryKey: ['devotions'],
  queryFn: ({ pageParam }: { pageParam: number }) => getDevotions({ offset: pageParam, limit: 7 }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getDevotions>>) => lastPage.nextCursor,
  keepPreviousData: true,
});

export const DevotionSidebar = () => {
  const navigate = useNavigate();

  const [devotionStore, setDevotionStore] = useDevotionStore();

  const devotionsQuery = createInfiniteQuery(() => getDevotionsQueryOptions());

  const [devotions, setDevotions] = createStore<
    Awaited<ReturnType<typeof getDevotions>>['devotions']
  >([]);
  createEffect(() => {
    if (devotionsQuery.status === 'success') {
      setDevotions(reconcile(devotionsQuery.data.pages.flatMap((page) => page.devotions)));
    }
  });

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger
          as={SheetTrigger}
          class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
          aria-label='View Devotions'
        >
          <History size={24} />
        </TooltipTrigger>
        <TooltipContent>View Devotions</TooltipContent>
      </Tooltip>
      <SheetContent
        position='left'
        defaultCloseButton={false}
        class='h-full pt-safe pb-safe pl-safe'
      >
        <div class='flex h-full w-full max-w-none flex-col space-y-2 p-6'>
          <SheetHeader class='flex flex-row items-center justify-between'>
            <SheetTitle>Devotion History</SheetTitle>
            <SheetClose as={Button} variant='ghost' size='icon'>
              <X size={24} />
            </SheetClose>
          </SheetHeader>
          <div class='flex max-h-full grow flex-col overflow-y-auto'>
            <div class='flex grow flex-col gap-2 pr-3'>
              <QueryBoundary query={devotionsQuery}>
                {() => (
                  <For
                    each={devotions}
                    fallback={
                      <div class='flex h-full w-full flex-1 items-center justify-center'>
                        <H6>No devotions yet</H6>
                      </div>
                    }
                  >
                    {(devotion, idx) => (
                      <div
                        data-index={idx()}
                        class={cn(
                          'group flex h-fit w-full items-center justify-between gap-2 overflow-hidden rounded-lg p-2 hover:bg-accent',
                          devotionStore.devotion?.id === devotion.id && 'bg-accent',
                        )}
                      >
                        <SheetClose
                          as={Button}
                          variant='ghost'
                          onClick={() => {
                            setDevotionStore('devotion', devotion);
                            navigate(`/devotion/${devotion.id}`);
                          }}
                          class='h flex h-fit w-full flex-1 overflow-hidden px-0 text-left'
                        >
                          <div class='flex w-full flex-col overflow-hidden'>
                            <span class='line-clamp-2'>{toTitleCase(devotion.topic)}</span>
                            <span class='text-muted-foreground text-sm'>
                              {formatDate(devotion.createdAt, 'MMMM d, yyyy')}
                            </span>
                          </div>
                        </SheetClose>
                      </div>
                    )}
                  </For>
                )}
              </QueryBoundary>
              <Show
                when={devotionsQuery.status === 'success' && Boolean(devotionsQuery.hasNextPage)}
              >
                <Button
                  class='w-full'
                  disabled={Boolean(devotionsQuery.isFetchingNextPage)}
                  onClick={() => devotionsQuery.fetchNextPage()}
                >
                  Load More
                </Button>
              </Show>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
