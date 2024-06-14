import { BookPicker } from './chapter-picker';
import { SmallTranslationPicker } from './translation-picker';

export const BibleReaderMenu = () => {
  return (
    <div class="flex w-full space-x-2">
      <BookPicker />
      <SmallTranslationPicker />
    </div>
  );
};
