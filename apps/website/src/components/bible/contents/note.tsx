import type { NoteContent as NoteContentType } from '@theaistudybible/core/types/bible';
import type { InferResponseType } from 'hono/client';
import { NotepadTextIcon } from 'lucide-solid';
import { Button } from '~/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { RpcClient } from '~/types/rpc';
import Contents from './contents';

export default function NoteContent({
  bible,
  book,
  chapter,
  content,
  highlights
}: {
  bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
  book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
  chapter: InferResponseType<RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
  content: NoteContentType;
  highlights?: {
    id: string;
    color: string;
  }[];
}) {
  return (
    <Popover placement="top">
      <PopoverTrigger class="mx-1 px-2 py-0" as={Button} variant="ghost" size="sm">
        <NotepadTextIcon size={12} />
      </PopoverTrigger>
      <PopoverContent class="eb-container w-52 p-2">
        <Contents
          bible={bible}
          book={book}
          chapter={chapter}
          contents={content.contents}
          highlights={highlights}
          class="text-sm"
        />
      </PopoverContent>
    </Popover>
  );
}
