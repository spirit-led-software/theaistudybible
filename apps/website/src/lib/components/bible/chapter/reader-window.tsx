'use client';

import type { Routes } from '@/types/rpc';
import type { InferResponseType } from 'hono/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
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
  bible: InferResponseType<Routes['bibles'][':id']['$get']>['data'];
  book: InferResponseType<Routes['bibles'][':id']['books'][':bookId']['$get']>['data'];
  chapter: InferResponseType<Routes['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
  chapterHighlights?: InferResponseType<
    Routes['bibles'][':id']['chapters'][':chapterId']['highlights']['$get'],
    200
  >['data'];
}) {
  return (
    <div className="mt-10">
      <ChapterContent
        bible={bible}
        book={book}
        chapter={chapter}
        chapterHighlights={chapterHighlights}
      />
      <div className="fixed bottom-0 left-0 right-0 flex place-items-center justify-center">
        <ChatButton />
      </div>
      <ChatWindow />
      {chapter.previous && (
        <div className="fixed bottom-1/3 left-0 top-1/3 flex flex-col place-items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="my-auto h-20 w-10 rounded-r-2xl" asChild>
                <Link
                  href={`/bible/${bible.abbreviation}/${chapter.previous.abbreviation.split('.')[0]}/${chapter.previous.number}`}
                >
                  <ChevronLeft size={20} className="shrink-0" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{chapter.previous.name}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      {chapter.next && (
        <div className="fixed bottom-1/3 right-0 top-1/3 flex flex-col place-items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="my-auto h-20 w-10 rounded-l-2xl" asChild>
                <Link
                  href={`/bible/${bible.abbreviation}/${chapter.next.abbreviation.split('.')[0]}/${chapter.next.number}`}
                >
                  <ChevronRight size={20} className="shrink-0" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{chapter.next.name}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
