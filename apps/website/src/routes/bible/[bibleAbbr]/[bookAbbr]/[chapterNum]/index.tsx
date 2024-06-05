import { RouteDefinition } from '@solidjs/router';
import { BookPicker } from '~/components/bible/chapter-picker';
import ChapterReader from '~/components/bible/chapter/reader';
import { SmallTranslationPicker } from '~/components/bible/translation-picker';

export const route: RouteDefinition = {};

export default function ChapterPage({
  params
}: {
  params: {
    bibleAbbr: string;
    bookAbbr: string;
    chapterNum: number;
  };
}) {
  const { bibleAbbr, bookAbbr, chapterNum } = params;

  return (
    <div class="relative flex h-full w-full flex-col justify-center px-16 py-5 md:px-20 lg:px-36 xl:px-48">
      <div class="flex h-full w-full flex-col overflow-hidden">
        <div class="flex w-full space-x-2">
          <BookPicker bibleAbbr={bibleAbbr} bookAbbr={bookAbbr} chapterNum={chapterNum} />
          <SmallTranslationPicker
            bibleAbbr={bibleAbbr}
            bookAbbr={bookAbbr}
            chapterNum={chapterNum}
          />
        </div>
        <ChapterReader bibleAbbr={bibleAbbr} bookAbbr={bookAbbr} chapterNum={chapterNum} />
      </div>
    </div>
  );
}
