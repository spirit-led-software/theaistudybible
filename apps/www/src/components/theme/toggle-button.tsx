import { Button } from '@/www/components/ui/button';
import { useColorMode } from '@kobalte/core';
import { Laptop, Moon, Sun } from 'lucide-solid';
import { createSignal } from 'solid-js';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export function ThemeToggleButton() {
  const [open, setOpen] = createSignal(false);
  const { colorMode, setColorMode } = useColorMode();

  const icon = colorMode() === 'light' ? <Moon /> : <Sun />;

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <PopoverTrigger as={Button} size='icon' variant='ghost' class='size-8'>
        {icon}
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
