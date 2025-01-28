import { toTitleCase } from '@/core/utils/string';
import { useDevotionStore } from '@/www/contexts/devotion';
import { ChevronLeft, SidebarIcon } from 'lucide-solid';
import { createMemo } from 'solid-js';
import { Button } from '../ui/button';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { H6 } from '../ui/typography';

export const DevotionMenu = () => {
  const [devotionStore] = useDevotionStore();
  const { open } = useSidebar();

  const devotionTopic = createMemo(() =>
    toTitleCase(devotionStore.devotion?.topic ?? 'New Devotion'),
  );

  return (
    <div
      class='flex w-full justify-center border-b pt-2 shadow-xs'
      role='banner'
      aria-label='Devotion header'
    >
      <div class='flex w-full max-w-3xl items-center gap-2 py-1'>
        <SidebarTrigger as={Button} size='icon' variant='ghost' aria-label='View Devotions'>
          {open() ? <ChevronLeft /> : <SidebarIcon />}
        </SidebarTrigger>
        <H6 class='truncate' aria-label='Devotion topic'>
          {devotionTopic()}
        </H6>
      </div>
    </div>
  );
};
