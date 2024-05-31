'use client';

import type { Routes } from '@/types/rpc';
import type { InferResponseType } from 'hono/client';
import { H2 } from '../../ui/typeography';
import '../contents/contents.css';
import ReaderContent from '../contents/reader-content';

export default function ChapterContent({
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
    <>
      <H2 className="text-center">{chapter.name}</H2>
      <ReaderContent
        bible={bible}
        book={book}
        chapter={chapter}
        chapterHighlights={chapterHighlights}
        // @ts-expect-error - This is a hack to get around the API response types
        contents={chapter.content}
      />
    </>
  );
}
