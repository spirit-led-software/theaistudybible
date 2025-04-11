import { type Theme, useTheme } from '@/www/contexts/theme';
import { Laptop, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const ThemeToggleButton = () => {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon'>
          {theme === 'light' ? (
            <Sun size={18} />
          ) : theme === 'dark' ? (
            <Moon size={18} />
          ) : (
            <Laptop size={18} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
            <DropdownMenuRadioItem value='light' className='flex items-center gap-2'>
              <Sun size={18} /> Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='dark' className='flex items-center gap-2'>
              <Moon size={18} /> Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='system' className='flex items-center gap-2'>
              <Laptop size={18} /> System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};
