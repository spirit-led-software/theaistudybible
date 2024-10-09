import { db } from '@/core/database';
import { cn } from '@/www/lib/utils';
import { requireAuth } from '@/www/server/auth';
import { useLocation, useNavigate } from '@solidjs/router';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { formatDate } from 'date-fns';
import { Clock, X } from 'lucide-solid';
import { For, Match, Switch, createEffect } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { useChatStore } from '../../../contexts/chat';
import { QueryBoundary } from '../../query-boundary';
import { Button, buttonVariants } from '../../ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../ui/sheet';
import { Spinner } from '../../ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { H6 } from '../../ui/typography';
import { DeleteChatButton } from './delete-chat-button';
import { EditChatButton } from './edit-chat-button';

const getChats = async ({ offset, limit }: { offset: number; limit: number }) => {
  'use server';
  const { user } = requireAuth();
  const chats = await db.query.chats.findMany({
    where: (chats, { eq }) => eq(chats.userId, user.id),
    orderBy: (chats, { desc }) => desc(chats.updatedAt),
    offset,
    limit,
  });
  return {
    chats,
    nextCursor: chats.length === limit ? offset + chats.length : undefined,
  };
};

export const getChatsQueryOptions = {
  queryKey: ['chats', { limit: 10 }],
  queryFn: ({ pageParam }: { pageParam: number }) => getChats({ offset: pageParam, limit: 10 }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: { nextCursor?: number }) => lastPage.nextCursor,
};

export const ChatSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [chatStore, setChatStore] = useChatStore();

  const chatsQuery = createInfiniteQuery(() => getChatsQueryOptions);

  const [chats, setChats] = createStore(
    !chatsQuery.isLoading && chatsQuery.data
      ? chatsQuery.data.pages.flatMap((page) => page.chats)
      : [],
  );
  createEffect(() => {
    if (!chatsQuery.isLoading && chatsQuery.data) {
      setChats(reconcile(chatsQuery.data.pages.flatMap((page) => page.chats)));
    }
  });

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger
          as={SheetTrigger}
          class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
        >
          <Clock size={24} />
        </TooltipTrigger>
        <TooltipContent>View Chats</TooltipContent>
      </Tooltip>
      <SheetContent
        position='left'
        defaultCloseButton={false}
        class='h-full pt-safe pb-safe pl-safe'
      >
        <div class='flex h-full w-full max-w-none flex-col space-y-2 p-6'>
          <SheetHeader class='flex flex-row items-center justify-between'>
            <SheetTitle>Chat History</SheetTitle>
            <SheetClose as={Button} variant='ghost' size='icon'>
              <X size={24} />
            </SheetClose>
          </SheetHeader>
          <div class='flex max-h-full grow flex-col overflow-y-auto'>
            <div class='flex grow flex-col gap-2 pr-3'>
              <QueryBoundary query={chatsQuery}>
                {() => (
                  <For
                    each={chats}
                    fallback={
                      <div class='flex h-full w-full flex-1 items-center justify-center'>
                        <H6>No chats yet</H6>
                      </div>
                    }
                  >
                    {(chat, idx) => (
                      <div
                        data-index={idx()}
                        class={cn(
                          'group flex h-fit w-full items-center justify-between gap-2 overflow-hidden rounded-lg p-2 hover:bg-accent',
                          chatStore.chat?.id === chat.id && 'bg-muted',
                        )}
                      >
                        <SheetClose
                          as={Button}
                          variant='ghost'
                          onClick={() => {
                            setChatStore('chat', chat);
                            if (location.pathname.startsWith('/chat')) {
                              navigate(`/chat/${chat.id}`);
                            }
                          }}
                          class='flex h-fit w-full flex-1 overflow-hidden px-0 text-left'
                        >
                          <div class='flex w-full flex-col overflow-hidden'>
                            <span class='line-clamp-2'>{chat.name}</span>
                            <span class='text-muted-foreground text-sm'>
                              {formatDate(chat.updatedAt, 'MMMM d, yyyy')}
                            </span>
                          </div>
                        </SheetClose>
                        <div class='flex flex-col'>
                          <EditChatButton chat={chat} />
                          <DeleteChatButton chat={chat} />
                        </div>
                      </div>
                    )}
                  </For>
                )}
              </QueryBoundary>
              <Switch>
                <Match when={chatsQuery.isFetchingNextPage}>
                  <Spinner />
                </Match>
                <Match when={chatsQuery.hasNextPage}>
                  <Button
                    class='w-full'
                    onClick={() => {
                      if (!chatsQuery.isFetchingNextPage) {
                        void chatsQuery.fetchNextPage();
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
