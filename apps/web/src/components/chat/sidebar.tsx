import { A } from '@solidjs/router';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { Menu, X } from 'lucide-solid';
import { For } from 'solid-js';
import { auth } from '~/lib/server/clerk';
import { cn } from '~/lib/utils';
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
  const query = createInfiniteQuery(() => ({
    queryKey: ['chats'],
    queryFn: ({ pageParam }) => getChats({ offset: pageParam, limit: 10 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  }));

  return (
    <Drawer side="left">
      <DrawerTrigger as={Button} size="icon" variant="ghost">
        <Menu size={24} />
      </DrawerTrigger>
      <DrawerContent class="w-5/6">
        <div class="block h-dvh w-full max-w-none space-y-2 p-5">
          <DrawerHeader class="flex items-center justify-between">
            <DrawerTitle>Chats</DrawerTitle>
            <DrawerClose as={Button} variant="ghost" size="icon">
              <X size={24} />
            </DrawerClose>
          </DrawerHeader>
          <QueryBoundary query={query}>
            {(chats) => (
              <For each={chats.pages.flatMap((page) => page.chats)}>
                {(chat) => (
                  <DrawerClose
                    as={A}
                    href={`/chat/${chat.id}`}
                    class={cn(buttonVariants({ variant: 'ghost' }), 'w-full justify-start')}
                  >
                    {chat.name}
                  </DrawerClose>
                )}
              </For>
            )}
          </QueryBoundary>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
