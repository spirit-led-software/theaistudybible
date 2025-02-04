import { Button } from '@/www/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/www/components/ui/dropdown-menu';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { EllipsisVertical } from 'lucide-solid';
import { Show } from 'solid-js';
import { ChapterBookmarkMenuItem } from './bookmark/chapter';
import { BookPicker } from './chapter-picker/book';
import { TextSizeMenuItem } from './text-size';
import { SmallTranslationPicker } from './translation-picker/small';

export const BibleReaderMenu = () => {
  const [brStore] = useBibleReaderStore();
  return (
    <div class='fixed inset-x-safe top-20 flex w-full border-b bg-background/80 px-4 py-2 shadow-xs backdrop-blur-md'>
      <div class='flex w-full items-center justify-center gap-2 sm:mx-auto sm:max-w-3xl'>
        <BookPicker />
        <SmallTranslationPicker />
        <DropdownMenu>
          <DropdownMenuTrigger as={Button} size='icon' variant='outline'>
            <EllipsisVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <Show when={brStore.chapter}>
              <ChapterBookmarkMenuItem />
            </Show>
            <TextSizeMenuItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
