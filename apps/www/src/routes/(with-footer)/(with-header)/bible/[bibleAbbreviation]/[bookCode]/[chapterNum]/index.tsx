import { ChapterReader, chapterReaderQueryOptions } from '@/www/components/bible/chapter/reader';
import { bookPickerQueryOptions } from '@/www/components/bible/reader/menu/chapter-picker/book';
import { smallBiblePickerQueryOptions } from '@/www/components/bible/small-bible-picker';
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
        chapterReaderQueryOptions({
          bibleAbbreviation: params.bibleAbbreviation,
          bookCode: params.bookCode,
          chapterNum: Number.parseInt(params.chapterNum),
        }),
      ),
    ]);
  },
};

export default function ChapterPage() {
  const params = useParams();

  return (
    <Show when={params.chapterNum} keyed>
      <ChapterReader
        bibleAbbreviation={params.bibleAbbreviation}
        bookCode={params.bookCode}
        chapterNum={Number.parseInt(params.chapterNum)}
      />
    </Show>
  );
}
