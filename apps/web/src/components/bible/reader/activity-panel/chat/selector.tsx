import { createQuery } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
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
import { Spinner } from '~/components/ui/spinner';
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

  return (
    <QueryBoundary query={chatsQuery} loadingFallback={<Spinner size="sm" />}>
      {(chats) => (
        <div class="flex flex-1 items-center space-x-2">
          <Select<Chat | null>
            value={chats.find((chat) => chat.id === brStore.chatId) ?? null}
            onChange={(value) => setBrStore('chatId', value?.id)}
            options={chats}
            optionValue="id"
            optionTextValue="name"
            optionDisabled={(chat) => chat.id === brStore.chatId}
            placeholder="New Chat"
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
            <TooltipTrigger
              as={Button}
              variant="ghost"
              onClick={() => {
                setBrStore('chatId', undefined);
              }}
            >
              <PenBox size={15} />
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        </div>
      )}
    </QueryBoundary>
  );
};
