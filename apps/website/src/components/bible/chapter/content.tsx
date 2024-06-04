import type { InferResponseType } from 'hono/client';
import type { RpcClient } from '~/types/rpc';
import { H2 } from '../../ui/typography';
import '../contents/contents.css';
import ReaderContent from '../contents/reader-content';

export default function ChapterContent({
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
    <>
      <H2 class="text-center">{chapter.name}</H2>
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
