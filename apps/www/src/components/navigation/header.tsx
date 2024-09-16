import { useWindowSize } from '@solid-primitives/resize-observer';
import { A } from '@solidjs/router';
import { createMemo } from 'solid-js';
import { AuthLoaded, SignedIn, SignedOut } from '../auth/control';
import { SignInButton } from '../auth/sign-in-button';
import { UserButton } from '../auth/user-button';
import Logo from '../branding/logo';
import LogoSmall from '../branding/logo-small';
import { ThemeToggleButton } from '../theme/toggle-button';
import { Button } from '../ui/button';
import { CreditDisplay } from './credit-display';
import { NavigationDrawer } from './drawer';
import { Menu } from './menu';

export default function NavigationHeader() {
  const size = useWindowSize();
  const smallWindow = createMemo(() => size.width < 768);

  return (
    <nav class='fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-b-border bg-background/80 py-6 pr-4 pl-2 backdrop-blur-md transition-all duration-300 ease-in-out'>
      <div class='flex w-1/3 justify-start sm:hidden'>
        <NavigationDrawer />
      </div>
      <div class='flex w-1/3 justify-center sm:justify-start'>
        <A href='/'>
          {smallWindow() ? <LogoSmall width={128} height={64} /> : <Logo width={256} height={64} />}
        </A>
      </div>
      <div class='hidden w-1/3 justify-center sm:flex'>
        <div class='flex w-full place-items-center justify-center'>
          <Menu orientation='horizontal' />
        </div>
      </div>
      <div class='flex w-1/3 items-center justify-end gap-2'>
        <ThemeToggleButton />
        <AuthLoaded>
          <SignedIn>
            <CreditDisplay />
            <UserButton showName={!smallWindow()} />
          </SignedIn>
          <SignedOut>
            <Button as={SignInButton} />
          </SignedOut>
        </AuthLoaded>
      </div>
    </nav>
  );
}
