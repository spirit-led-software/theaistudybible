import { cn } from '@/www/lib/utils';
import { useLocation } from '@tanstack/react-router';
import { MenuIcon } from 'lucide-react';
import { createContext, useMemo, useState } from 'react';
import { useCallback, useContext, useEffect } from 'react';
import { SignedIn, SignedOut } from '../auth/control';
import { SignInButton } from '../auth/sign-in-button';
import { UserButton } from '../auth/user-button';
import { Logo } from '../branding/logo';
import { LogoSmall } from '../branding/logo-small';
import { ThemeToggleButton } from '../theme-toggle-button';
import { NavigationDropdown } from './dropdown';
import { Menu } from './menu';

type NavigationHeaderContextType = {
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  lastScrollY: number;
  setLastScrollY: React.Dispatch<React.SetStateAction<number>>;
};

const NavigationHeaderContext = createContext<NavigationHeaderContextType | null>(null);

export const NavigationHeaderProvider = (props: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const value = useMemo(
    () => ({ isVisible, setIsVisible, lastScrollY, setLastScrollY }),
    [isVisible, lastScrollY],
  );

  return (
    <NavigationHeaderContext.Provider value={value}>
      {props.children}
    </NavigationHeaderContext.Provider>
  );
};

export type NavigationHeaderProps = {
  sticky?: boolean;
};

export const useNavigationHeader = () => {
  const context = useContext(NavigationHeaderContext);
  if (!context) {
    throw new Error('useNavigationHeader must be used within a NavigationHeaderProvider');
  }
  return context;
};

export function NavigationHeader({ sticky = true }: NavigationHeaderProps) {
  const location = useLocation();

  const { isVisible, setIsVisible, lastScrollY, setLastScrollY } = useNavigationHeader();

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setIsVisible(currentScrollY < lastScrollY || currentScrollY < 50);
    setLastScrollY(currentScrollY);
  }, [lastScrollY, setIsVisible, setLastScrollY]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (sticky) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [sticky, handleScroll]);

  return (
    <nav
      className={cn(
        'flex h-18 w-full items-center justify-between border-b border-b-border bg-background/80 px-4 py-1 shadow-xs backdrop-blur-md transition-transform duration-300 ease-in-out',
        sticky && 'sticky inset-x-safe top-safe z-50',
        sticky && !isVisible && '-translate-y-full',
      )}
    >
      <div className='flex items-center justify-start'>
        <NavigationDropdown variant='ghost' className='h-fit w-fit px-2 sm:hidden'>
          <MenuIcon />
          <LogoSmall
            width={128}
            height={64}
            className='h-auto w-24'
            lightClassName='sm:hidden dark:hidden'
            darkClassName='dark:sm:hidden'
          />
        </NavigationDropdown>
        <Logo
          width={256}
          height={64}
          lightClassName='hidden sm:block dark:hidden'
          darkClassName='hidden dark:hidden dark:sm:block'
        />
      </div>
      <div className='hidden items-center justify-center sm:flex sm:grow'>
        <Menu orientation='horizontal' />
      </div>
      <div className='flex items-center justify-end gap-2'>
        <SignedOut>
          <ThemeToggleButton />
          <SignInButton redirectUrl={`${location.pathname}${location.searchStr}`} />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}
