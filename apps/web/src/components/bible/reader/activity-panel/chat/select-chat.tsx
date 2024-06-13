import { db } from '@lib/server/database';
import { createQuery } from '@tanstack/solid-query';
import { Chat } from '@theaistudybible/core/model/chat';
import { PenBox } from 'lucide-solid';
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
import { useAuth } from '~/hooks/clerk';

const getChats = async ({ offset, limit }: { offset: number; limit: number }) => {
  'use server';
  return await db.query.chats.findMany({
    orderBy: (chats, { desc }) => desc(chats.updatedAt),
    offset,
    limit
  });
};

export const SelectChatDropdown = () => {
  const { isSignedIn } = useAuth();
  const [bibleReaderStore, setBibleReaderStore] = useBibleReaderStore();
  const chatsQuery = createQuery(() => ({
    queryKey: ['chats', { offset: 0, limit: 10 }],
    queryFn: () => getChats({ offset: 0, limit: 10 })
  }));

  return (
    <QueryBoundary query={chatsQuery}>
      {(chats) => (
        <div class="flex space-x-2">
          <Select
            disabled={!isSignedIn()}
            onChange={(value) => setBibleReaderStore('chatId', value.id)}
            options={chats}
            optionValue="id"
            optionTextValue="name"
            optionDisabled={(chat) => chat.id === bibleReaderStore.chatId}
            placeholder="Chat"
            itemComponent={(props) => (
              <SelectItem item={props.item}>{props.item.rawValue.name}</SelectItem>
            )}
          >
            <SelectTrigger class="w-fit max-w-full">
              <SelectValue<Chat>>{(state) => state.selectedOption().name}</SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
          <Button
            variant="ghost"
            disabled={!isSignedIn()}
            onClick={() => setBibleReaderStore('chatId', undefined)}
          >
            <PenBox size={15} />
          </Button>
        </div>
      )}
    </QueryBoundary>
  );
};
