import { bookPickerQueryOptions } from '@/www/components/bible/reader/menu/chapter-picker/book';
import { smallBiblePickerQueryOptions } from '@/www/components/bible/small-bible-picker';
import { VerseReader, getVerseReaderQueryOptions } from '@/www/components/bible/verse/reader';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { Show } from 'solid-js';

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const qc = useQueryClient();
    Promise.all([
      qc.prefetchQuery(bookPickerQueryOptions(params.bibleAbbreviation)),
      qc.prefetchQuery(smallBiblePickerQueryOptions()),
      qc.prefetchQuery(
        getVerseReaderQueryOptions({
          bibleAbbreviation: params.bibleAbbreviation,
          bookCode: params.bookCode,
          chapterNum: Number.parseInt(params.chapterNum),
          verseNum: Number.parseInt(params.verseNum),
        }),
      ),
    ]);
  },
};

export default function ChapterPage() {
  const params = useParams();

  return (
    <Show when={params.verseNum} keyed>
      <VerseReader
        bibleAbbreviation={params.bibleAbbreviation}
        bookCode={params.bookCode}
        chapterNum={Number.parseInt(params.chapterNum)}
        verseNum={Number.parseInt(params.verseNum)}
      />
    </Show>
  );
}
