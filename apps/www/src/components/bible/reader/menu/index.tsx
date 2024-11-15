import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { Match, Switch } from 'solid-js';
import { ChapterBookmarkButton } from './bookmark-button/chapter';
import { VerseBookmarkButton } from './bookmark-button/verse';
import { BookPicker } from './chapter-picker/book';
import { SmallTranslationPicker } from './translation-picker/small';

export const BibleReaderMenu = () => {
  const [brStore] = useBibleReaderStore();
  return (
    <div class='flex w-full flex-wrap items-center gap-2'>
      <BookPicker />
      <SmallTranslationPicker />
      <Switch>
        <Match when={brStore.verse}>
          <VerseBookmarkButton />
        </Match>
        <Match when={brStore.chapter}>
          <ChapterBookmarkButton />
        </Match>
      </Switch>
    </div>
  );
};
