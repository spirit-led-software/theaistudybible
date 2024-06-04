import { A } from '@solidjs/router';
import type { InferResponseType } from 'hono/client';
import { ChevronLeft, ChevronRight } from 'lucide-solid';
import type { RpcClient } from '~/types/rpc';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import ChatButton from '../chat/button';
import ChatWindow from '../chat/window';
import ChapterContent from './content';

export default function ChapterReaderWindow({
  bible,
  book,
  chapter,
  chapterHighlights
}: {
  bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
  book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
  chapter: InferResponseType<RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
  chapterHighlights?: InferResponseType<
    RpcClient['bibles'][':id']['chapters'][':chapterId']['highlights']['$get'],
    200
  >['data'];
}) {
  return (
    <div class="mt-10">
      <ChapterContent
        bible={bible}
        book={book}
        chapter={chapter}
        chapterHighlights={chapterHighlights}
      />
      <div class="fixed bottom-0 left-0 right-0 flex place-items-center justify-center">
        <ChatButton />
      </div>
      <ChatWindow />
      {chapter.previous && (
        <div class="fixed bottom-1/3 left-0 top-1/3 flex flex-col place-items-center justify-center">
          <Tooltip placement="right">
            <TooltipTrigger
              as={() => (
                <Button
                  class="my-auto h-20 w-10 rounded-r-2xl"
                  as={() => (
                    <A
                      href={`/bible/${bible.abbreviation}/${chapter.previous?.abbreviation.split('.')[0]}/${chapter.previous?.number}`}
                    >
                      <ChevronLeft size={20} class="shrink-0" />
                    </A>
                  )}
                />
              )}
            />
            <TooltipContent>
              <p>{chapter.previous.name}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      {chapter.next && (
        <div class="fixed bottom-1/3 right-0 top-1/3 flex flex-col place-items-center justify-center">
          <Tooltip placement="left">
            <TooltipTrigger
              as={() => (
                <Button
                  class="my-auto h-20 w-10 rounded-l-2xl"
                  as={() => (
                    <A
                      href={`/bible/${bible.abbreviation}/${chapter.next?.abbreviation.split('.')[0]}/${chapter.next?.number}`}
                    >
                      <ChevronRight size={20} class="shrink-0" />
                    </A>
                  )}
                />
              )}
            />
            <TooltipContent>
              <p>{chapter.next.name}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
