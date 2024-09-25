import { A } from '@solidjs/router';
import { AuthLoaded, AuthLoading, SignedIn, SignedOut } from '../auth/control';
import { SignInButton } from '../auth/sign-in-button';
import { UserButton } from '../auth/user-button';
import Logo from '../branding/logo';
import LogoSmall from '../branding/logo-small';
import { ThemeToggleButton } from '../theme/toggle-button';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { CreditDisplay } from './credit-display';
import { NavigationDrawer } from './drawer';
import { Menu } from './menu';

export default function NavigationHeader() {
  return (
    <nav class='fixed inset-x-safe top-safe z-50 flex h-20 items-center justify-between border-b border-b-border bg-background/80 py-6 pr-4 pl-2 backdrop-blur-md transition-all duration-300 ease-in-out'>
      <div class='flex w-1/3 justify-start sm:hidden sm:w-0'>
        <NavigationDrawer />
      </div>
      <div class='flex w-1/3 justify-center sm:justify-start'>
        <A href='/'>
          <LogoSmall width={128} height={64} class='block sm:hidden' />
          <Logo width={256} height={64} class='hidden sm:block' />
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
            <UserButton />
          </SignedIn>
          <SignedOut>
            <Button as={SignInButton} />
          </SignedOut>
        </AuthLoaded>
        <AuthLoading>
          <Spinner size='sm' />
        </AuthLoading>
      </div>
    </nav>
  );
}
