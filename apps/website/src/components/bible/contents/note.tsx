import { Button } from '~/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { RpcClient } from '~/types/rpc';
import type { NoteContent as NoteContentType } from '@theaistudybible/core/types/bible';
import type { InferResponseType } from 'hono/client';
import { NotepadTextIcon } from 'lucide-solid';
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
    <Popover>
      <PopoverTrigger asChild className="mx-1">
        <Button variant="ghost" size="sm" className="px-2 py-0">
          <NotepadTextIcon size={12} />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="eb-container w-52 p-2">
        <Contents
          bible={bible}
          book={book}
          chapter={chapter}
          contents={content.contents}
          highlights={highlights}
          className="text-sm"
        />
      </PopoverContent>
    </Popover>
  );
}
