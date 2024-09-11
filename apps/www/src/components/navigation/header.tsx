import { dark } from '@clerk/themes';
import { useColorMode } from '@kobalte/core';
import { useWindowSize } from '@solid-primitives/resize-observer';
import { A, useLocation } from '@solidjs/router';
import { ClerkLoaded, SignedIn, SignedOut, SignInButton, UserButton } from 'clerk-solidjs';
import { createMemo } from 'solid-js';
import Logo from '../branding/logo';
import LogoSmall from '../branding/logo-small';
import { ThemeToggleButton } from '../theme/toggle-button';
import { Button } from '../ui/button';
import { CreditDisplay } from './credit-display';
import { NavigationDrawer } from './drawer';
import { Menu } from './menu';

export default function NavigationHeader() {
  const location = useLocation();

  const { colorMode } = useColorMode();
  const size = useWindowSize();
  const smallWindow = createMemo(() => size.width < 768);

  return (
    <nav class="border-b-border bg-background/80 fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b py-6 pl-2 pr-4 backdrop-blur-md transition-all duration-300 ease-in-out">
      <div class="flex w-1/3 justify-start sm:hidden">
        <NavigationDrawer />
      </div>
      <div class="flex w-1/3 justify-center sm:justify-start">
        <A href="/">
          {smallWindow() ? <LogoSmall width={128} height={64} /> : <Logo width={256} height={64} />}
        </A>
      </div>
      <div class="hidden w-1/3 justify-center sm:flex">
        <div class="flex w-full place-items-center justify-center">
          <Menu orientation="horizontal" />
        </div>
      </div>
      <div class="flex w-1/3 items-center justify-end gap-2">
        <ThemeToggleButton />
        <ClerkLoaded>
          <SignedIn>
            <CreditDisplay />
            <UserButton
              showName={!smallWindow()}
              appearance={{
                baseTheme: colorMode() === 'dark' ? dark : undefined,
                elements: {
                  userButtonOuterIdentifier: 'text-foreground',
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <Button as={SignInButton} mode="modal" forceRedirectUrl={location.pathname} />
          </SignedOut>
        </ClerkLoaded>
      </div>
    </nav>
  );
}
