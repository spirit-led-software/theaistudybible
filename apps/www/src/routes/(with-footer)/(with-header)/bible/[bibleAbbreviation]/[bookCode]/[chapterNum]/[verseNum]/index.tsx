import { bookPickerQueryOptions } from '@/www/components/bible/reader/menu/chapter-picker/book';
import { smallBiblePickerQueryOptions } from '@/www/components/bible/small-bible-picker';
import { VerseReader, getVerseReaderQueryOptions } from '@/www/components/bible/verse/reader';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { createMemo } from 'solid-js';

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { bibleAbbreviation, bookCode } = params;
    const chapterNum = Number.parseInt(params.chapterNum);
    const verseNum = Number.parseInt(params.verseNum);

    const qc = useQueryClient();
    Promise.all([
      qc.prefetchQuery(bookPickerQueryOptions(bibleAbbreviation)),
      qc.prefetchQuery(smallBiblePickerQueryOptions()),
      qc.prefetchQuery(
        getVerseReaderQueryOptions({ bibleAbbreviation, bookCode, chapterNum, verseNum }),
      ),
    ]);
  },
};

export default function ChapterPage() {
  const params = useParams();

  const chapterNum = createMemo(() => Number.parseInt(params.chapterNum));
  const verseNum = createMemo(() => Number.parseInt(params.verseNum));

  return (
    <VerseReader
      bibleAbbreviation={params.bibleAbbreviation}
      bookCode={params.bookCode}
      chapterNum={chapterNum()}
      verseNum={verseNum()}
    />
  );
}
