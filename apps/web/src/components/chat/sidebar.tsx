import { A } from '@solidjs/router';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import day from 'dayjs';
import { Clock } from 'lucide-solid';
import { For, Match, Switch, createEffect, on } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { auth } from '~/lib/server/clerk';
import { cn } from '~/lib/utils';
import { useChatStore } from '../providers/chat';
import { QueryBoundary } from '../query-boundary';
import { Button, buttonVariants } from '../ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '../ui/sheet';
import { Spinner } from '../ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

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
  const [chatStore] = useChatStore();

  const query = createInfiniteQuery(() => ({
    queryKey: ['chats', { limit: 10 }],
    queryFn: ({ pageParam }) => getChats({ offset: pageParam, limit: 10 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  }));

  const [chats, setChats] = createStore(query.data?.pages.flatMap((page) => page.chats) ?? []);
  createEffect(
    on(
      () => query.data,
      (data) => {
        setChats(reconcile(data?.pages.flatMap((page) => page.chats) ?? [], { merge: true }));
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
        <div class="block h-full w-full max-w-none space-y-2 px-2 pb-10">
          <SheetHeader>
            <SheetTitle>Chats</SheetTitle>
          </SheetHeader>
          <div class="flex max-h-full flex-1 flex-col overflow-y-auto">
            <div class="flex h-fit flex-col pr-3">
              <QueryBoundary query={query}>
                {() => (
                  <For each={chats}>
                    {(chat, idx) => (
                      <SheetClose
                        as={A}
                        href={`/chat/${chat.id}`}
                        data-index={idx()}
                        class={cn(
                          buttonVariants({ variant: 'ghost' }),
                          'h-fit w-full justify-start',
                          chatStore.chat?.id === chat.id && 'bg-muted'
                        )}
                      >
                        <div class="flex flex-col">
                          <span>{chat.name}</span>
                          <span class="text-sm text-muted-foreground">
                            {day(chat.updatedAt).format('MMMM D, YYYY')}
                          </span>
                        </div>
                      </SheetClose>
                    )}
                  </For>
                )}
              </QueryBoundary>
              <Switch>
                <Match when={query.isFetchingNextPage}>
                  <Spinner />
                </Match>
                <Match when={query.hasNextPage}>
                  <Button
                    class="w-full"
                    onClick={(e: Event) => {
                      e.preventDefault();
                      if (!query.isFetchingNextPage) {
                        query.fetchNextPage();
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
