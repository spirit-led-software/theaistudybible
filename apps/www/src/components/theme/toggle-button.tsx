import { Button } from '@/www/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/www/components/ui/dropdown-menu';
import { useColorMode } from '@kobalte/core';
import { Laptop, Moon, Sun } from 'lucide-solid';

export function ThemeToggleButton() {
  const { setColorMode } = useColorMode();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        as={Button}
        size='icon'
        variant='ghost'
        class='size-8'
        aria-label='Toggle theme'
      >
        <Sun class='rotate-0 scale-100 transition-all duration-300 dark:rotate-180 dark:scale-0' />
        <Moon class='absolute rotate-180 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100' />
        <span class='sr-only'>Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => setColorMode('light')} aria-label='Set theme to light'>
          <Sun class='mr-2 size-4' />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setColorMode('dark')} aria-label='Set theme to dark'>
          <Moon class='mr-2 size-4' />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setColorMode('system')} aria-label='Set theme to system'>
          <Laptop class='mr-2 size-4' />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
