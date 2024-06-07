import { A } from '@solidjs/router';
import type { InferResponseType } from 'hono/client';
import { ChevronLeft, ChevronRight } from 'lucide-solid';
import type { RpcClient } from '~/types/rpc';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import ChatButton from '../chat/button';
import ChatWindow from '../chat/window';
import VerseContent from './content';

export default function VerseReaderWindow({
  bible,
  book,
  chapter,
  chapterHighlights,
  verse
}: {
  bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
  book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
  chapter: InferResponseType<RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
  chapterHighlights?: InferResponseType<
    RpcClient['bibles'][':id']['chapters'][':chapterId']['highlights']['$get'],
    200
  >['data'];
  verse: InferResponseType<RpcClient['bibles'][':id']['verses'][':verseId']['$get']>['data'];
}) {
  return (
    <div class="mt-10">
      <VerseContent
        bible={bible}
        book={book}
        chapter={chapter}
        chapterHighlights={chapterHighlights}
        verse={verse}
      />
      <div class="fixed bottom-0 left-0 right-0 flex place-items-center justify-center">
        <ChatButton />
      </div>
      <ChatWindow />
      {verse.previous && (
        <div class="fixed bottom-1/3 left-0 top-1/3 flex flex-col place-items-center justify-center">
          <Tooltip placement="right">
            <TooltipTrigger
              as={() => (
                <Button
                  class="my-auto h-20 w-10 rounded-r-2xl"
                  as={A}
                  href={
                    `/bible/${bible.abbreviation}/${chapter.previous?.abbreviation.split('.')[0]}` +
                    `/${verse.previous?.abbreviation.split('.')[1]}/${verse.previous?.number}`
                  }
                >
                  <ChevronLeft size={20} class="shrink-0" />
                </Button>
              )}
            />
            <TooltipContent>
              <p>{verse.previous?.name}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      {verse.next && (
        <div class="fixed bottom-1/3 right-0 top-1/3 flex flex-col place-items-center justify-center">
          <Tooltip placement="left">
            <TooltipTrigger
              as={() => (
                <Button
                  class="my-auto h-20 w-10 rounded-l-2xl"
                  as={A}
                  href={
                    `/bible/${bible.abbreviation}/${chapter.next?.abbreviation.split('.')[0]}` +
                    `/${verse.next?.abbreviation.split('.')[1]}/${verse.next?.number}`
                  }
                >
                  <ChevronRight size={20} class="shrink-0" />
                </Button>
              )}
            />
            <TooltipContent>
              <p>{verse.next?.name}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
