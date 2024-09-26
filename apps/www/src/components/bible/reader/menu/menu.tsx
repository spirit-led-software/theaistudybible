import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { Match, Switch } from 'solid-js';
import { ChapterBookmarkButton, VerseBookmarkButton } from './bookmark-button';
import { BookPicker } from './chapter-picker';
import { SmallTranslationPicker } from './translation-picker';

export const BibleReaderMenu = () => {
  const [brStore] = useBibleReaderStore();
  return (
    <div class='flex w-full items-center space-x-2'>
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
