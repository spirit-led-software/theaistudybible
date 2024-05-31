'use client';

import type { Routes } from '@/types/rpc';
import type { InferResponseType } from 'hono/client';
import { H2 } from '../../ui/typeography';
import '../contents/contents.css';
import ReaderContent from '../contents/reader-content';

export default function VerseContent({
  bible,
  book,
  chapter,
  chapterHighlights,
  verse
}: {
  bible: InferResponseType<Routes['bibles'][':id']['$get']>['data'];
  book: InferResponseType<Routes['bibles'][':id']['books'][':bookId']['$get']>['data'];
  chapter: InferResponseType<Routes['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
  chapterHighlights?: InferResponseType<
    Routes['bibles'][':id']['chapters'][':chapterId']['highlights']['$get'],
    200
  >['data'];
  verse: InferResponseType<Routes['bibles'][':id']['verses'][':verseId']['$get']>['data'];
}) {
  return (
    <>
      <H2 className="text-center">{verse.name}</H2>
      <ReaderContent
        bible={bible}
        book={book}
        chapter={chapter}
        chapterHighlights={chapterHighlights}
        contents={verse.content}
      />
    </>
  );
}
