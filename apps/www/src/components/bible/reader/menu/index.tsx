import { Button } from '@/www/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/www/components/ui/dropdown-menu';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { EllipsisVertical } from 'lucide-solid';
import { Match, Switch } from 'solid-js';
import { ChapterBookmarkMenuItem } from './bookmark/chapter';
import { VerseBookmarkMenuItem } from './bookmark/verse';
import { BookPicker } from './chapter-picker/book';
import { TextSizeMenuItem } from './text-size';
import { SmallTranslationPicker } from './translation-picker/small';

export const BibleReaderMenu = () => {
  const [brStore] = useBibleReaderStore();
  return (
    <div class='fixed top-20 flex items-center gap-2 rounded-b-lg bg-background/80 p-2 backdrop-blur-md'>
      <BookPicker />
      <SmallTranslationPicker />
      <DropdownMenu>
        <DropdownMenuTrigger as={Button} size='icon'>
          <EllipsisVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <Switch>
            <Match when={brStore.verse}>
              <VerseBookmarkMenuItem />
            </Match>
            <Match when={brStore.chapter}>
              <ChapterBookmarkMenuItem />
            </Match>
          </Switch>
          <TextSizeMenuItem />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
