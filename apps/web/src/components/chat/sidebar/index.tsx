import { useLocation, useNavigate } from '@solidjs/router';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import day from 'dayjs';
import { Clock } from 'lucide-solid';
import { For, Match, Switch, createEffect, on } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { auth } from '~/lib/server/clerk';
import { cn } from '~/lib/utils';
import { useChatStore } from '../../providers/chat';
import { QueryBoundary } from '../../query-boundary';
import { Button, buttonVariants } from '../../ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '../../ui/sheet';
import { Spinner } from '../../ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { H6 } from '../../ui/typography';
import { DeleteChatButton } from './delete-chat-button';
import { EditChatButton } from './edit-chat-button';

const getChats = async ({ offset, limit }: { offset: number; limit: number }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('User is not authenticated');
  }

  const chats = await db.query.chats.findMany({
    where: (chats, { eq }) => eq(chats.userId, userId),
    orderBy: (chats, { desc }) => desc(chats.updatedAt),
    offset,
    limit
  });

  return {
    chats,
    nextCursor: chats.length === limit ? offset + chats.length : undefined
  };
};

export const ChatSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [chatStore, setChatStore] = useChatStore();

  const chatsQuery = createInfiniteQuery(() => ({
    queryKey: ['chats', { limit: 10 }],
    queryFn: ({ pageParam }) => getChats({ offset: pageParam, limit: 10 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  }));

  const [chats, setChats] = createStore(chatsQuery.data?.pages.flatMap((page) => page.chats) ?? []);
  createEffect(
    on(
      () => chatsQuery.data,
      (data) => {
        setChats(
          reconcile(data?.pages.flatMap((page) => page.chats) ?? [], {
            merge: true
          })
        );
      }
    )
  );

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
      <SheetContent class="h-dvh" position="left">
        <div class="flex h-full w-full max-w-none flex-col space-y-2 px-2 pb-10">
          <SheetHeader>
            <SheetTitle>Chats</SheetTitle>
          </SheetHeader>
          <div class="flex max-h-full grow flex-col overflow-y-auto">
            <div class="flex grow flex-col gap-2 pr-3">
              <QueryBoundary query={chatsQuery}>
                {() => (
                  <For
                    each={chats}
                    fallback={
                      <div class="flex h-full w-full flex-1 items-center justify-center">
                        <H6>No chats yet</H6>
                      </div>
                    }
                  >
                    {(chat, idx) => (
                      <div
                        data-index={idx()}
                        class={cn(
                          'group flex h-fit w-full items-center justify-between gap-2 rounded-lg p-2 hover:bg-accent',
                          chatStore.chat?.id === chat.id && 'bg-muted'
                        )}
                      >
                        <SheetClose
                          as={Button}
                          variant="ghost"
                          onClick={() => {
                            setChatStore('chat', chat);
                            if (location.pathname.startsWith('/chat')) {
                              navigate(`/chat/${chat.id}`);
                            }
                          }}
                          class="flex h-fit flex-1 px-0 text-left"
                        >
                          <div class="flex flex-col">
                            <span class="line-clamp-2 group-hover:line-clamp-none">
                              {chat.name}
                            </span>
                            <span class="text-sm text-muted-foreground">
                              {day(chat.updatedAt).format('MMMM D, YYYY')}
                            </span>
                          </div>
                        </SheetClose>
                        <div class="invisible flex group-hover:visible">
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
                    class="w-full"
                    onClick={() => {
                      if (!chatsQuery.isFetchingNextPage) {
                        chatsQuery.fetchNextPage();
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
