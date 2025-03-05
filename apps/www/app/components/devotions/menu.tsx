import { toTitleCase } from '@/core/utils/string';
import { useDevotionStore } from '@/www/contexts/devotion';
import { ChevronLeft, SidebarIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '../ui/button';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { H6 } from '../ui/typography';

export const DevotionMenu = () => {
  const devotionStore = useDevotionStore();
  const { open } = useSidebar();

  const devotionTopic = useMemo(
    () => toTitleCase(devotionStore.devotion?.topic ?? 'New Devotion'),
    [devotionStore.devotion?.topic],
  );

  return (
    <div
      className='sticky top-0 z-40 w-full justify-center border-b pt-2 shadow-xs'
      role='banner'
      aria-label='Devotion header'
    >
      <div className='flex w-full max-w-3xl items-center gap-2 py-1'>
        <SidebarTrigger asChild>
          <Button variant='ghost' size='icon' aria-label='View Devotions'>
            {open ? <ChevronLeft /> : <SidebarIcon />}
          </Button>
        </SidebarTrigger>
        <H6 className='truncate' aria-label='Devotion topic'>
          {devotionTopic}
        </H6>
      </div>
    </div>
  );
};
