import { ChapterReader, chapterReaderQueryOptions } from '@/www/components/bible/chapter/reader';
import { bookPickerQueryOptions } from '@/www/components/bible/reader/menu/chapter-picker/book';
import { smallTranslationPickerQueryOptions } from '@/www/components/bible/reader/menu/translation-picker/small';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { createMemo } from 'solid-js';

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { bibleAbbr, bookCode } = params;
    const chapterNum = Number.parseInt(params.chapterNum);

    const qc = useQueryClient();
    Promise.all([
      qc.prefetchQuery(bookPickerQueryOptions(bibleAbbr)),
      qc.prefetchQuery(smallTranslationPickerQueryOptions()),
      qc.prefetchQuery(chapterReaderQueryOptions({ bibleAbbr, bookCode, chapterNum })),
    ]);
  },
};

export default function ChapterPage() {
  const params = useParams();

  const chapterNum = createMemo(() => Number.parseInt(params.chapterNum));

  return (
    <ChapterReader
      bibleAbbr={params.bibleAbbr}
      bookCode={params.bookCode}
      chapterNum={chapterNum()}
    />
  );
}
