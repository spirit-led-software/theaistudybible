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

const getChats = async ({ offset, limit }: { offset: number; limit: number }) => {
  'use server';
  return await db.query.chats.findMany({
    orderBy: (chats, { desc }) => desc(chats.updatedAt),
    offset,
    limit
  });
};

export const ChatSelector = () => {
  const [bibleReaderStore, setBibleReaderStore] = useBibleReaderStore();
  const chatsQuery = createQuery(() => ({
    queryKey: ['chats', { offset: 0, limit: 10 }],
    queryFn: () => getChats({ offset: 0, limit: 10 })
  }));

  const [value, setValue] = createSignal<Chat | null>(null);
  createEffect(() => {
    setBibleReaderStore('chatId', () => value()?.id);
  });

  return (
    <QueryBoundary query={chatsQuery}>
      {(chats) => (
        <div class="flex space-x-2">
          <Select<Chat | null>
            value={value()}
            onChange={setValue}
            options={chats}
            optionValue="id"
            optionTextValue="name"
            optionDisabled={(chat) => chat.id === bibleReaderStore.chatId}
            placeholder="Chat"
            itemComponent={(props) => (
              <SelectItem item={props.item}>{props.item.rawValue?.name ?? 'Chat'}</SelectItem>
            )}
          >
            <SelectTrigger class="w-fit max-w-full">
              <SelectValue<Chat>>{(state) => state.selectedOption()?.name}</SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
          <Button
            variant="ghost"
            onClick={() => {
              setValue(null);
            }}
          >
            <PenBox size={15} />
          </Button>
        </div>
      )}
    </QueryBoundary>
  );
};
