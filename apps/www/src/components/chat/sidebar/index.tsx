import { db } from '@/core/database';
import { chats as chatsTable, messages as messagesTable } from '@/core/database/schema';
import { ilike } from '@/core/database/utils';
import { cn } from '@/www/lib/utils';
import { requireAuth } from '@/www/server/utils/auth';
import { getHighlightedContent } from '@/www/utils/get-highlighted-content';
import { useLocation, useNavigate } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { formatDate } from 'date-fns';
import { type SQL, and, desc, eq, getTableColumns } from 'drizzle-orm';
import { Menu, PenBox, Search, X } from 'lucide-solid';
import { For, Show, createEffect, createSignal } from 'solid-js';
import { useChatStore } from '../../../contexts/chat';
import { LogoSmall } from '../../branding/logo-small';
import { NavigationDropdown } from '../../navigation/dropdown';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { H3, H6 } from '../../ui/typography';
import { DeleteChatButton } from './delete-chat-button';

const getChats = GET(
  async ({
    offset,
    limit,
    searchQuery,
  }: { offset: number; limit: number; searchQuery?: string }) => {
    'use server';
    const { user } = requireAuth();

    let chatCondition: SQL | undefined = eq(chatsTable.userId, user.id);
    if (searchQuery) {
      chatCondition = and(chatCondition, ilike(chatsTable.name, `%${searchQuery}%`));
    }
    const query = db
      .select({
        ...getTableColumns(chatsTable),
        ...(searchQuery ? { message: getTableColumns(messagesTable) } : {}),
      })
      .from(chatsTable)
      .where(chatCondition);
    if (searchQuery) {
      query.leftJoin(
        messagesTable,
        and(
          eq(chatsTable.id, messagesTable.chatId),
          ilike(messagesTable.content, `%${searchQuery}%`),
        ),
      );
    }
    query.orderBy(desc(chatsTable.updatedAt)).limit(limit).offset(offset);

    const chats = await query.execute();

    return {
      chats,
      nextCursor: chats.length === limit ? offset + chats.length : null,
    };
  },
);

export const getChatsQueryOptions = (searchQuery?: string) => ({
  queryKey: ['chats', { searchQuery }],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getChats({ offset: pageParam, limit: 15, searchQuery }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getChats>>) => lastPage.nextCursor,
});

export const ChatSidebar = () => {
  const navigate = useNavigate();

  const [chatStore, setChatStore] = useChatStore();
  const { isMobile, toggleSidebar } = useSidebar();

  const [searchQuery, setSearchQuery] = createSignal('');
  const chatsQuery = createInfiniteQuery(() => ({
    ...getChatsQueryOptions(searchQuery()),
    placeholderData: (prev) => prev,
  }));

  const location = useLocation();
  const [isChatPage, setIsChatPage] = createSignal(false);
  createEffect(() => {
    setIsChatPage(location.pathname.startsWith('/chat'));
  });

  return (
    <Sidebar
      class='h-full pt-safe-offset-2 pr-1 pb-safe-offset-2 pl-safe-offset-2'
      gapFixerClass='h-full'
      variant={isChatPage() ? 'sidebar' : 'sheet'}
    >
      <SidebarHeader class='flex flex-col gap-2'>
        <div class='flex items-center justify-between'>
          <H3>Chat History</H3>
          <Tooltip>
            <TooltipTrigger
              as={Button}
              size='icon'
              variant='ghost'
              onClick={() => {
                setChatStore('chatId', null);
                if (!isChatPage() || isMobile()) {
                  toggleSidebar();
                }
              }}
              aria-label='Start new chat'
            >
              <PenBox />
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        </div>
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
          {(data) => (
            <SidebarMenu class='pr-2'>
              <For
                each={data.pages.flatMap((page) => page.chats)}
                fallback={
                  <div class='flex h-full w-full flex-1 items-center justify-center px-5 py-10'>
                    <H6>No chats found</H6>
                  </div>
                }
              >
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
                        <div class='truncate'>
                          {getHighlightedContent(chat.name, searchQuery())}
                        </div>
                        <div class='text-muted-foreground text-xs'>
                          {formatDate(chat.updatedAt, 'MMMM d, yyyy')}
                        </div>
                        {chat.message?.content && (
                          <div class='mt-1 text-xs'>
                            {getHighlightedContent(chat.message.content, searchQuery(), 50)}
                          </div>
                        )}
                      </div>
                    </SidebarMenuButton>
                    <DeleteChatButton chat={chat} />
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
          )}
        </QueryBoundary>
      </SidebarContent>
      <SidebarFooter>
        <Show when={isChatPage()}>
          <NavigationDropdown
            variant='ghost'
            class='flex h-fit w-full items-center justify-between px-4 py-1'
          >
            <LogoSmall width={128} height={64} class='h-auto w-24' lightClass='dark:hidden' />
            <Menu />
          </NavigationDropdown>
        </Show>
      </SidebarFooter>
    </Sidebar>
  );
};
