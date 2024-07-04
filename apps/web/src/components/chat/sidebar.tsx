import { A } from '@solidjs/router';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import day from 'dayjs';
import { Menu, X } from 'lucide-solid';
import { For, Match, Switch, createEffect, on } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { auth } from '~/lib/server/clerk';
import { cn } from '~/lib/utils';
import { useChatStore } from '../providers/chat';
import { QueryBoundary } from '../query-boundary';
import { Button, buttonVariants } from '../ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '../ui/drawer';
import { Spinner } from '../ui/spinner';

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
    <Drawer side="left">
      <DrawerTrigger as={Button} size="icon" variant="ghost">
        <Menu size={24} />
      </DrawerTrigger>
      <DrawerContent class="w-5/6">
        <div class="block h-dvh w-full max-w-none space-y-2 overflow-y-auto p-5">
          <DrawerHeader class="flex items-center justify-between">
            <DrawerTitle>Chats</DrawerTitle>
            <DrawerClose as={Button} variant="ghost" size="icon">
              <X size={24} />
            </DrawerClose>
          </DrawerHeader>
          <QueryBoundary query={query}>
            {() => (
              <For each={chats}>
                {(chat) => (
                  <DrawerClose
                    as={A}
                    href={`/chat/${chat.id}`}
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
                  </DrawerClose>
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
                onClick={() => {
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
      </DrawerContent>
    </Drawer>
  );
};
