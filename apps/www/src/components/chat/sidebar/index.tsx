import { db } from '@/core/database';
import { ilike } from '@/core/database/utils';
import type { Chat, Message } from '@/schemas/chats/types';
import { cn } from '@/www/lib/utils';
import { requireAuth } from '@/www/server/auth';
import { useLocation, useNavigate } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { formatDate } from 'date-fns';
import { Search, X } from 'lucide-solid';
import { For, Show, createMemo, createSignal } from 'solid-js';
import { useChatStore } from '../../../contexts/chat';
import { QueryBoundary } from '../../query-boundary';
import { Button } from '../../ui/button';
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
} from '../../ui/sidebar';
import { H3, H6 } from '../../ui/typography';
import { DeleteChatButton } from './delete-chat-button';
import { EditChatButton } from './edit-chat-button';

const getChats = GET(
  async ({
    offset,
    limit,
    searchQuery,
  }: { offset: number; limit: number; searchQuery?: string }) => {
    'use server';
    const { user } = requireAuth();

    let chatsWithMessagesThatMatch: (Chat & { message: Message })[] = [];
    if (searchQuery) {
      chatsWithMessagesThatMatch = await db.query.messages
        .findMany({
          where: (messages, { and, eq }) =>
            and(eq(messages.userId, user.id), ilike(messages.content, `%${searchQuery}%`)),
          with: { chat: true },
        })
        .then((messages) => messages.map((message) => ({ ...message.chat, message: message })));
    }

    const chats: (Chat & { message?: Message })[] = await db.query.chats.findMany({
      where: (chats, { and, or, eq, inArray }) => {
        const baseCondition = eq(chats.userId, user.id);
        if (searchQuery) {
          const searchCondition = ilike(chats.name, `%${searchQuery}%`);
          if (chatsWithMessagesThatMatch.length > 0) {
            return and(
              baseCondition,
              or(
                searchCondition,
                inArray(
                  chats.id,
                  chatsWithMessagesThatMatch.map((c) => c.id),
                ),
              ),
            );
          }
          return and(baseCondition, searchCondition);
        }
        return baseCondition;
      },
      orderBy: (chats, { desc }) => desc(chats.updatedAt),
      offset,
      limit,
    });

    for (const chat of chats) {
      const message = chatsWithMessagesThatMatch.find((c) => c.id === chat.id);
      if (message) {
        chat.message = message.message;
      }
    }

    return {
      chats,
      nextCursor: chats.length === limit ? offset + chats.length : undefined,
    };
  },
);

export const getChatsQueryOptions = (searchQuery?: string) => ({
  queryKey: ['chats', { searchQuery }],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getChats({ offset: pageParam, limit: 7, searchQuery }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getChats>>) => lastPage.nextCursor,
  keepPreviousData: true,
});

export const ChatSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [chatStore, setChatStore] = useChatStore();
  const { isMobile, toggleSidebar } = useSidebar();

  const [searchQuery, setSearchQuery] = createSignal('');
  const chatsQuery = createInfiniteQuery(() => getChatsQueryOptions(searchQuery()));

  const isChatPage = createMemo(() => location.pathname.startsWith('/chat'));

  return (
    <Sidebar
      class='h-full pt-safe-offset-2 pr-1 pb-safe-offset-2 pl-safe-offset-2'
      gapFixerClass='h-full'
      variant={isChatPage() ? 'sidebar' : 'sheet'}
    >
      <SidebarHeader class='flex flex-col gap-2'>
        <H3>Chat History</H3>
        <div class='relative'>
          <Search class='-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground' />
          <SidebarInput
            type='text'
            placeholder='Search chats'
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
        <QueryBoundary query={chatsQuery}>
          {({ pages }) => {
            const chats = pages.flatMap((page) => page.chats);
            return (
              <Show
                when={chats.length > 0 && chats}
                fallback={
                  <div class='flex h-full w-full flex-1 items-center justify-center'>
                    <H6>No chats found</H6>
                  </div>
                }
                keyed
              >
                <SidebarMenu class='pr-2'>
                  <For each={chats}>
                    {(chat, idx) => (
                      <SidebarMenuItem
                        data-index={idx()}
                        class={cn(
                          'group/chat-item flex h-fit w-full items-center justify-between overflow-hidden rounded-lg px-1 hover:bg-accent',
                          chatStore.chat?.id === chat.id && 'bg-muted',
                        )}
                      >
                        <SidebarMenuButton
                          onClick={() => {
                            setChatStore('chatId', chat.id);
                            if (isChatPage()) {
                              navigate(`/chat/${chat.id}`);
                            }
                            if (!isChatPage() || isMobile()) {
                              toggleSidebar();
                            }
                          }}
                          class='flex min-h-fit w-full flex-1 grow p-3 text-left'
                        >
                          <div class='flex w-full flex-col'>
                            <div class='truncate-fade'>
                              {getHighlightedChatName(chat.name, searchQuery())}
                            </div>
                            <div class='text-muted-foreground text-xs'>
                              {formatDate(chat.updatedAt, 'MMMM d, yyyy')}
                            </div>
                            <Show when={chat.message?.content} keyed>
                              {(content) => (
                                <div class='mt-1 text-xs'>
                                  {getHighlightedMessageExcerpt(content, searchQuery())}
                                </div>
                              )}
                            </Show>
                          </div>
                        </SidebarMenuButton>
                        <div class='flex flex-col'>
                          <EditChatButton chat={chat} />
                          <DeleteChatButton chat={chat} />
                        </div>
                      </SidebarMenuItem>
                    )}
                  </For>
                  <Show when={chatsQuery.hasNextPage}>
                    <Button
                      class='w-full'
                      disabled={chatsQuery.isFetchingNextPage}
                      onClick={() => chatsQuery.fetchNextPage()}
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

const getHighlightedChatName = (name: string, query: string) => {
  if (!query || !name.toLowerCase().includes(query.toLowerCase())) {
    return name;
  }

  return name
    .split(new RegExp(`(${query.toLowerCase()})`, 'gi'))
    .map((part) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span class='inline bg-yellow-200/50 dark:bg-yellow-500/30'>{part}</span>
      ) : (
        part
      ),
    );
};

const getHighlightedMessageExcerpt = (content: string, query: string) => {
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
