import { cn } from '@/www/lib/utils';
import { useLocation } from '@solidjs/router';
import { MenuIcon } from 'lucide-solid';
import {
  type JSX,
  createContext,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js';
import { SignedIn, SignedOut } from '../auth/control';
import { SignInButton } from '../auth/sign-in-button';
import { UserButton } from '../auth/user-button';
import { Logo } from '../branding/logo';
import { LogoSmall } from '../branding/logo-small';
import { ThemeToggleButton } from '../theme/toggle-button';
import { Button } from '../ui/button';
import { NavigationDropdown } from './dropdown';
import { Menu } from './menu';

type NavigationHeaderContextType = {
  isVisible: () => boolean;
  setIsVisible: (isVisible: boolean) => void;
  lastScrollY: () => number;
  setLastScrollY: (lastScrollY: number) => void;
};

const NavigationHeaderContext = createContext<NavigationHeaderContextType>();

export const NavigationHeaderProvider = (props: { children: JSX.Element }) => {
  const [isVisible, setIsVisible] = createSignal(true);
  const [lastScrollY, setLastScrollY] = createSignal(0);

  return (
    <NavigationHeaderContext.Provider
      value={{ isVisible, setIsVisible, lastScrollY, setLastScrollY }}
    >
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

export function NavigationHeader(_props: NavigationHeaderProps) {
  const props = mergeProps({ sticky: true }, _props);

  const location = useLocation();

  const { isVisible, setIsVisible, lastScrollY, setLastScrollY } = useNavigationHeader();

  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    setIsVisible(currentScrollY < lastScrollY() || currentScrollY < 50);
    setLastScrollY(currentScrollY);
  };

  onMount(() => {
    if (props.sticky) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      onCleanup(() => window.removeEventListener('scroll', handleScroll));
    }
  });

  return (
    <nav
      class={cn(
        'flex h-18 w-full items-center justify-between border-b border-b-border bg-background/80 px-4 py-1 shadow-xs backdrop-blur-md transition-transform duration-300 ease-in-out',
        props.sticky && 'sticky inset-x-safe top-safe z-50',
        props.sticky && !isVisible() && '-translate-y-full',
      )}
    >
      <div class='flex items-center justify-start'>
        <NavigationDropdown variant='ghost' class='h-fit w-fit px-2 sm:hidden'>
          <MenuIcon />
          <LogoSmall
            width={128}
            height={64}
            class='h-auto w-24'
            lightClass='sm:hidden dark:hidden'
            darkClass='dark:sm:hidden'
          />
        </NavigationDropdown>
        <Logo
          width={256}
          height={64}
          lightClass='hidden sm:block dark:hidden'
          darkClass='hidden dark:hidden dark:sm:block'
        />
      </div>
      <div class='hidden items-center justify-center sm:flex sm:grow'>
        <Menu orientation='horizontal' />
      </div>
      <div class='flex items-center justify-end gap-2'>
        <SignedOut>
          <ThemeToggleButton />
          <Button as={SignInButton} redirectUrl={`${location.pathname}${location.search}`} />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}
