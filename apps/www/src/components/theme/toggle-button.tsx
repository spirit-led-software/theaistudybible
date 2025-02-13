import { Button } from '@/www/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/www/components/ui/dropdown-menu';
import { type ConfigColorMode, useColorMode } from '@kobalte/core/color-mode';
import { Laptop, Moon, Sun } from 'lucide-solid';

export function ThemeToggleButton() {
  const { colorMode, setColorMode } = useColorMode();

  return (
    <DropdownMenu placement='bottom-end'>
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
        <DropdownMenuRadioGroup
          value={colorMode()}
          onChange={(value) => setColorMode(value as ConfigColorMode)}
        >
          <DropdownMenuRadioItem
            value='light'
            aria-label='Set theme to light'
            class='flex items-center gap-2'
          >
            <Sun class='size-4' /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value='dark'
            aria-label='Set theme to dark'
            class='flex items-center gap-2'
          >
            <Moon class='size-4' /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value='system'
            aria-label='Set theme to system'
            class='flex items-center gap-2'
          >
            <Laptop class='size-4' /> System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
