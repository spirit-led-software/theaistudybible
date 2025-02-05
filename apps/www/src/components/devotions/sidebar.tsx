import { db } from '@/core/database';
import { ilike } from '@/core/database/utils';
import { toTitleCase } from '@/core/utils/string';
import { cn } from '@/www/lib/utils';
import { useNavigate } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { formatDate } from 'date-fns';
import { Search, X } from 'lucide-solid';
import { For, Match, Show, Switch, createSignal } from 'solid-js';
import { useDevotionStore } from '../../contexts/devotion';
import { QueryBoundary } from '../query-boundary';
import { Button } from '../ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar';
import { H3, H6 } from '../ui/typography';

const getDevotions = GET(
  async ({
    offset,
    limit,
    searchQuery,
  }: {
    offset: number;
    limit: number;
    searchQuery?: string;
  }) => {
    'use server';
    const devotions = await db.query.devotions.findMany({
      where: searchQuery
        ? (devotions, { or }) =>
            or(
              ilike(devotions.topic, `%${searchQuery}%`),
              ilike(devotions.summary, `%${searchQuery}%`),
              ilike(devotions.reflection, `%${searchQuery}%`),
              ilike(devotions.prayer, `%${searchQuery}%`),
            )
        : undefined,
      orderBy: (devotions, { desc }) => desc(devotions.createdAt),
      offset,
      limit,
    });

    return {
      devotions,
      nextCursor: devotions.length === limit ? offset + devotions.length : null,
    };
  },
);

export const getDevotionsQueryOptions = (searchQuery?: string) => ({
  queryKey: ['devotions', { searchQuery }],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getDevotions({ offset: pageParam, limit: 10, searchQuery }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getDevotions>>) => lastPage.nextCursor,
  keepPreviousData: true,
});

export const DevotionSidebar = () => {
  const navigate = useNavigate();
  const [devotionStore, setDevotionStore] = useDevotionStore();
  const { isMobile, toggleSidebar } = useSidebar();

  const [searchQuery, setSearchQuery] = createSignal('');
  const devotionsQuery = createInfiniteQuery(() => getDevotionsQueryOptions(searchQuery()));

  return (
    <Sidebar
      class='h-full pt-safe-offset-2 pr-1 pb-safe-offset-2 pl-safe-offset-2'
      gapFixerClass='h-full'
    >
      <SidebarHeader class='flex flex-col gap-2'>
        <H3>Devotion History</H3>
        <div class='relative'>
          <Search class='-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground' />
          <SidebarInput
            type='text'
            placeholder='Search devotions'
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            class='pr-8 pl-9'
          />
          <Show when={searchQuery()}>
            <Button
              variant='ghost'
              size='icon'
              class='-translate-y-1/2 absolute top-1/2 right-1 size-6 p-0.5'
              onClick={() => setSearchQuery('')}
            >
              <X class='size-4' />
            </Button>
          </Show>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <QueryBoundary query={devotionsQuery}>
          {({ pages }) => {
            const devotions = pages.flatMap((page) => page.devotions);
            return (
              <Show
                when={devotions.length > 0 && devotions}
                fallback={
                  <div class='flex h-full w-full flex-1 items-center justify-center'>
                    <H6>No devotions found</H6>
                  </div>
                }
                keyed
              >
                <SidebarMenu class='pr-2'>
                  <For each={devotions}>
                    {(devotion, idx) => (
                      <SidebarMenuItem
                        data-index={idx()}
                        class={cn(
                          'group flex h-fit w-full items-center justify-between overflow-hidden rounded-lg px-1 hover:bg-accent',
                          devotionStore.devotion?.id === devotion.id && 'bg-muted',
                        )}
                      >
                        <SidebarMenuButton
                          onClick={() => {
                            setDevotionStore('devotion', devotion);
                            navigate(`/devotion/${devotion.id}`);
                            if (isMobile()) {
                              toggleSidebar();
                            }
                          }}
                          class='flex min-h-fit w-full flex-1 grow overflow-hidden px-2 py-1 text-left'
                        >
                          <div class='flex w-full flex-col overflow-hidden'>
                            <span class='line-clamp-2'>
                              {getHighlightedDevotionTopic(devotion.topic, searchQuery())}
                            </span>
                            <span class='text-muted-foreground text-xs'>
                              {formatDate(devotion.createdAt, 'MMMM d, yyyy')}
                            </span>
                            <Show when={searchQuery()} keyed>
                              {(query) => (
                                <Switch>
                                  <Match
                                    when={devotion.bibleReading
                                      .toLowerCase()
                                      .includes(query.toLowerCase())}
                                  >
                                    <span class='mt-1 text-xs'>
                                      {getHighlightedContentExcerpt(devotion.summary, query)}
                                    </span>
                                  </Match>
                                  <Match
                                    when={devotion.summary
                                      .toLowerCase()
                                      .includes(query.toLowerCase())}
                                  >
                                    <span class='mt-1 text-xs'>
                                      {getHighlightedContentExcerpt(devotion.summary, query)}
                                    </span>
                                  </Match>
                                  <Match
                                    when={devotion.reflection
                                      .toLowerCase()
                                      .includes(query.toLowerCase())}
                                  >
                                    <span class='mt-1 text-xs'>
                                      {getHighlightedContentExcerpt(devotion.reflection, query)}
                                    </span>
                                  </Match>
                                  <Match
                                    when={devotion.prayer
                                      .toLowerCase()
                                      .includes(query.toLowerCase())}
                                  >
                                    <span class='mt-1 text-xs'>
                                      {getHighlightedContentExcerpt(devotion.prayer, query)}
                                    </span>
                                  </Match>
                                </Switch>
                              )}
                            </Show>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </For>
                  <Show when={devotionsQuery.hasNextPage}>
                    <Button
                      class='w-full'
                      disabled={devotionsQuery.isFetchingNextPage}
                      onClick={() => devotionsQuery.fetchNextPage()}
                    >
                      Load More
                    </Button>
                  </Show>
                </SidebarMenu>
              </Show>
            );
          }}
        </QueryBoundary>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};

const getHighlightedDevotionTopic = (topic: string, query: string) => {
  if (!query || !topic.toLowerCase().includes(query.toLowerCase())) {
    return toTitleCase(topic);
  }

  return toTitleCase(topic)
    .split(new RegExp(`(${query})`, 'gi'))
    .map((part) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span class='bg-yellow-200/50 dark:bg-yellow-500/30'>{part}</span>
      ) : (
        part
      ),
    );
};

const getHighlightedContentExcerpt = (content: string, query: string) => {
  if (!query || !content.toLowerCase().includes(query.toLowerCase())) {
    return content;
  }

  const matchIndex = content.toLowerCase().indexOf(query.toLowerCase());
  const remainingChars = Math.max(50 - query.length, 20);
  const charsEachSide = Math.floor(remainingChars / 2);

  const start = Math.max(0, matchIndex - charsEachSide);
  const end = Math.min(content.length, matchIndex + query.length + charsEachSide);
  const excerpt =
    (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');

  return excerpt
    .split(new RegExp(`(${query})`, 'gi'))
    .map((part) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span class='bg-yellow-200/50 dark:bg-yellow-500/30'>{part}</span>
      ) : (
        part
      ),
    );
};
