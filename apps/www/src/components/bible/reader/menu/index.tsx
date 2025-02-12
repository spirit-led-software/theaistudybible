import { useNavigationHeader } from '@/www/components/navigation/header';
import { Button } from '@/www/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/www/components/ui/dropdown-menu';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { EllipsisVertical } from 'lucide-solid';
import { Show } from 'solid-js';
import { ChapterBookmarkMenuItem } from './bookmark/chapter';
import { BookPicker } from './chapter-picker/book';
import { TextSizeMenuItem } from './text-size';
import { SmallTranslationPicker } from './translation-picker/small';

export const BibleReaderMenu = () => {
  const { isVisible: isHeaderVisible } = useNavigationHeader();
  const [brStore] = useBibleReaderStore();
  return (
    <div
      class={cn(
        'sm:-translate-x-1/2 sticky right-0 flex w-fit items-center gap-2 rounded-b-md border bg-background/90 p-1 shadow-xs backdrop-blur-md transition-all duration-300 ease-in-out sm:inset-x-1/2',
        isHeaderVisible() ? 'top-18' : 'top-0',
      )}
    >
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
  );
};
