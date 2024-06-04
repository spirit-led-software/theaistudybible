import type { InferResponseType } from 'hono/client';
import type { RpcClient } from '~/types/rpc';
import { H2 } from '../../ui/typography';
import '../contents/contents.css';
import ReaderContent from '../contents/reader-content';

export default function VerseContent({
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
    <>
      <H2 class="text-center">{verse.name}</H2>
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
