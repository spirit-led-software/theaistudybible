import { db } from '@/core/database';
import { toTitleCase } from '@/core/utils/string';
import { cn } from '@/www/lib/utils';
import { useNavigate } from '@solidjs/router';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { auth } from 'clerk-solidjs/server';
import { formatDate } from 'date-fns';
import { History } from 'lucide-solid';
import { For, Match, Switch, createEffect, on } from 'solid-js';
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
import { Spinner } from '../ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { H6 } from '../ui/typography';

const getDevotions = async ({ offset, limit }: { offset: number; limit: number }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('User is not authenticated');
  }

  const devotions = await db.query.devotions.findMany({
    orderBy: (devotions, { desc }) => desc(devotions.createdAt),
    offset,
    limit,
  });

  return {
    devotions,
    nextCursor: devotions.length === limit ? offset + devotions.length : undefined,
  };
};

export const DevotionSidebar = () => {
  const navigate = useNavigate();

  const [devotionStore, setDevotionStore] = useDevotionStore();

  const devotionsQuery = createInfiniteQuery(() => ({
    queryKey: ['devotions', { limit: 10 }],
    queryFn: ({ pageParam }) => getDevotions({ offset: pageParam, limit: 10 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  }));

  const [devotions, setDevotions] = createStore(
    devotionsQuery.data?.pages.flatMap((page) => page.devotions) ?? [],
  );
  createEffect(
    on(
      () => devotionsQuery.data,
      (data) => {
        setDevotions(
          reconcile(data?.pages.flatMap((page) => page.devotions) ?? [], {
            merge: true,
          }),
        );
      },
    ),
  );

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger
          as={SheetTrigger}
          class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
        >
          <History size={24} />
        </TooltipTrigger>
        <TooltipContent>View Devotions</TooltipContent>
      </Tooltip>
      <SheetContent class='h-dvh' position='left'>
        <div class='flex h-full w-full max-w-none flex-col space-y-2 px-2 pb-10'>
          <SheetHeader>
            <SheetTitle>Devotions</SheetTitle>
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
                    {(devotion) => (
                      <div
                        class={cn(
                          'hover:bg-accent group flex h-fit w-full items-center justify-between gap-2 overflow-hidden rounded-lg p-2',
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
              <Switch>
                <Match when={devotionsQuery.isFetchingNextPage}>
                  <Spinner />
                </Match>
                <Match when={devotionsQuery.hasNextPage}>
                  <Button
                    class='w-full'
                    onClick={() => {
                      if (!devotionsQuery.isFetchingNextPage) {
                        void devotionsQuery.fetchNextPage();
                      }
                    }}
                  >
                    Load More
                  </Button>
                </Match>
              </Switch>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
