import { Button } from '@/www/components/ui/button';
import { useColorMode } from '@kobalte/core';
import { Laptop, Moon, Sun } from 'lucide-solid';
import { createSignal } from 'solid-js';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export function ThemeToggleButton() {
  const [open, setOpen] = createSignal(false);
  const { setColorMode } = useColorMode();

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <PopoverTrigger as={Button} size='icon' variant='ghost' class='size-8'>
        <Sun class='rotate-0 scale-100 transition-all dark:rotate-180 dark:scale-0' />
        <Moon class='absolute rotate-180 scale-0 transition-all dark:rotate-0 dark:scale-100' />
        <span class='sr-only'>Toggle theme</span>
      </PopoverTrigger>
      <PopoverContent class='w-fit'>
        <div class='flex flex-col gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setColorMode('light');
              setOpen(false);
            }}
          >
            <Sun class='mr-2 inline-block size-4' />
            Light
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setColorMode('dark');
              setOpen(false);
            }}
          >
            <Moon class='mr-2 inline-block size-4' />
            Dark
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setColorMode('system');
              setOpen(false);
            }}
          >
            <Laptop class='mr-2 inline-block size-4' />
            System
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
