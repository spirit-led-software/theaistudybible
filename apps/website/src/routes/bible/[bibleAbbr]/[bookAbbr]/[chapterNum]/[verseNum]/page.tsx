import VerseReaderWindow from '@/components/bible/verse/reader-window';
import { createRpcClient } from '@/lib/server/rpc';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { redirect } from 'next/navigation';

export const dynamic = "force-dynamic";

export default async function VersePage({
  params
}: {
  params: { bible: string; book: string; chapter: string; verse: string };
}) {
  const rpcClient = createRpcClient(getRequestContext().env);

  const [bible, book, chapter, chapterHighlights, verse] = await Promise.all([
    rpcClient.bibles[':id']
      .$get({
        param: {
          id: params.bible
        }
      })
      .then(async (res) => {
        if (res.ok) {
          return await res.json();
        }
        return undefined;
      }),
    rpcClient.bibles[':id'].books[':bookId']
      .$get({
        param: {
          id: params.bible,
          bookId: params.book
        }
      })
      .then(async (res) => {
        if (res.ok) {
          return await res.json();
        }
        return undefined;
      }),
    rpcClient.bibles[':id'].chapters[':chapterId']
      .$get({
        param: {
          id: params.bible,
          chapterId: `${params.book}.${params.chapter}`
        }
      })
      .then(async (res) => {
        if (res.ok) {
          return await res.json();
        }
        return undefined;
      }),
    rpcClient.bibles[':id'].chapters[':chapterId'].highlights
      .$get({
        param: {
          id: params.bible,
          chapterId: `${params.book}.${params.chapter}`
        }
      })
      .then(async (res) => {
        if (res.ok) {
          return await res.json();
        }
        return undefined;
      }),
    rpcClient.bibles[':id'].verses[':verseId']
      .$get({
        param: {
          id: params.bible,
          verseId: `${params.book}.${params.chapter}.${params.verse}`
        }
      })
      .then(async (res) => {
        if (res.ok) {
          return await res.json();
        }
        return undefined;
      })
  ]);
  if (!bible?.data) {
    return redirect(`/bible`);
  }
  if (!book?.data || !chapter?.data || !verse?.data) {
    return redirect(`/bible/${params.bible}`);
  }

  return (
    <VerseReaderWindow
      bible={bible.data}
      book={book.data}
      chapter={chapter.data}
      chapterHighlights={chapterHighlights?.data}
      verse={verse.data}
    />
  );
}
