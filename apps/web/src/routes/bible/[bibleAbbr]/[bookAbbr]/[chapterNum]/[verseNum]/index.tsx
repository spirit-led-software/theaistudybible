import { RouteDefinition, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { Show } from 'solid-js';
import { bookPickerQueryOptions } from '~/components/bible/reader/menu/chapter-picker/book';
import { smallTranslationPickerQueryOptions } from '~/components/bible/reader/menu/translation-picker/small';
import VerseReader, { getVerseReaderQueryOptions } from '~/components/bible/verse/reader';

export const route: RouteDefinition = {
  load: async ({ params }) => {
    const { bibleAbbr, bookAbbr, chapterNum, verseNum } = params;

    const qc = useQueryClient();
    await Promise.all([
      qc.prefetchQuery(
        getVerseReaderQueryOptions({
          bibleAbbr,
          bookAbbr,
          chapterNum: parseInt(chapterNum),
          verseNum: parseInt(verseNum)
        })
      ),
      qc.prefetchQuery(bookPickerQueryOptions(bibleAbbr)),
      qc.prefetchQuery(smallTranslationPickerQueryOptions())
    ]);
  }
};

export default function ChapterPage() {
  const params = useParams();

  return (
    <div class="relative flex h-full w-full flex-col justify-center px-16 py-5 md:px-20 lg:px-36 xl:px-48">
      <Show when={params.verseNum} keyed>
        <VerseReader
          bibleAbbr={params.bibleAbbr}
          bookAbbr={params.bookAbbr}
          chapterNum={parseInt(params.chapterNum)}
          verseNum={parseInt(params.verseNum)}
        />
      </Show>
    </div>
  );
}
