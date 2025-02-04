import { ChapterReader, chapterReaderQueryOptions } from '@/www/components/bible/chapter/reader';
import { bookPickerQueryOptions } from '@/www/components/bible/reader/menu/chapter-picker/book';
import { smallBiblePickerQueryOptions } from '@/www/components/bible/small-bible-picker';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { createMemo } from 'solid-js';

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { bibleAbbreviation, bookCode } = params;
    const chapterNum = Number.parseInt(params.chapterNum);

    const qc = useQueryClient();
    Promise.all([
      qc.prefetchQuery(bookPickerQueryOptions(bibleAbbreviation)),
      qc.prefetchQuery(smallBiblePickerQueryOptions()),
      qc.prefetchQuery(
        chapterReaderQueryOptions({
          bibleAbbreviation,
          bookCode,
          chapterNum,
        }),
      ),
    ]);
  },
};

export default function ChapterPage() {
  const params = useParams();

  const chapterNum = createMemo(() => Number.parseInt(params.chapterNum));

  return (
    <ChapterReader
      bibleAbbreviation={params.bibleAbbreviation}
      bookCode={params.bookCode}
      chapterNum={chapterNum()}
    />
  );
}
