import { toTitleCase } from '@/core/utils/string';
import { useDevotionStore } from '@/www/contexts/devotion';
import { createMemo } from 'solid-js';
import { H6 } from '../ui/typography';
import { DevotionSidebar } from './sidebar';

export const DevotionMenu = () => {
  const [devotionStore] = useDevotionStore();

  const devotionTopic = createMemo(() => toTitleCase(devotionStore.devotion?.topic ?? 'Devotion'));

  return (
    <div class='absolute inset-x-0 top-0 z-40 flex h-20 w-full justify-center border-b bg-background/70 pt-2 shadow-sm backdrop-blur-md'>
      <div class='flex w-full max-w-2xl items-center justify-between px-3 py-1'>
        <H6 class='truncate'>{devotionTopic()}</H6>
        <div class='flex justify-end'>
          <DevotionSidebar />
        </div>
      </div>
    </div>
  );
};
