import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { Show } from 'solid-js';
import { ChapterBookmarkButton, VerseBookmarkButton } from './bookmark-button';
import { BookPicker } from './chapter-picker';
import { SmallTranslationPicker } from './translation-picker';

export const BibleReaderMenu = () => {
  const [brStore] = useBibleReaderStore();
  return (
    <div class="flex w-full items-center space-x-2">
      <BookPicker />
      <SmallTranslationPicker />
      <Show when={brStore.verse} fallback={<ChapterBookmarkButton />}>
        <VerseBookmarkButton />
      </Show>
    </div>
  );
};
