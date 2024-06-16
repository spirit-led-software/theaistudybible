import { db } from '@lib/server/database';
import { createQuery } from '@tanstack/solid-query';
import { Chat } from '@theaistudybible/core/model/chat';
import { PenBox } from 'lucide-solid';
import { createEffect, createSignal } from 'solid-js';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { QueryBoundary } from '~/components/query-boundary';
import { Button } from '~/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

const getChats = async ({ offset, limit }: { offset: number; limit: number }) => {
  'use server';
  return await db.query.chats.findMany({
    orderBy: (chats, { desc }) => desc(chats.updatedAt),
    offset,
    limit
  });
};

export const ChatSelector = () => {
  const [brStore, setBrStore] = useBibleReaderStore();
  const chatsQuery = createQuery(() => ({
    queryKey: ['chats', { offset: 0, limit: 10 }],
    queryFn: () => getChats({ offset: 0, limit: 10 })
  }));

  const [value, setValue] = createSignal<Chat | null>(
    chatsQuery.data?.find((chat) => chat.id === brStore.chatId) ?? null
  );
  createEffect(() => {
    setValue(() => chatsQuery.data?.find((chat) => chat.id === brStore.chatId) ?? null);
  });
  createEffect(() => {
    setBrStore('chatId', () => value()?.id);
  });

  return (
    <QueryBoundary query={chatsQuery}>
      {(chats) => (
        <div class="flex flex-1 items-center space-x-2">
          <Select<Chat | null>
            value={value()}
            onChange={setValue}
            options={chats}
            optionValue="id"
            optionTextValue="name"
            optionDisabled={(chat) => chat.id === brStore.chatId}
            placeholder="Chat"
            itemComponent={(props) => (
              <SelectItem item={props.item}>{props.item.rawValue?.name ?? 'Chat'}</SelectItem>
            )}
            class="w-full"
          >
            <SelectTrigger class="max-w-full flex-1">
              <SelectValue<Chat>>{(state) => state.selectedOption()?.name}</SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                onClick={() => {
                  setValue(null);
                }}
              >
                <PenBox size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        </div>
      )}
    </QueryBoundary>
  );
};
