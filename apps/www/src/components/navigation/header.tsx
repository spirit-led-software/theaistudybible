import { dark } from '@clerk/themes';
import { useColorMode } from '@kobalte/core';
import { createVisibilityObserver } from '@solid-primitives/intersection-observer';
import { useWindowSize } from '@solid-primitives/resize-observer';
import { A, useLocation } from '@solidjs/router';
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton
} from 'clerk-solidjs';
import { createMemo, createSignal } from 'solid-js';
import { cn } from '~/utils';
import Logo from '../branding/logo';
import LogoSmall from '../branding/logo-small';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { NavigationDrawer } from './drawer';
import { Menu } from './menu';

export default function NavigationHeader() {
  const location = useLocation();

  const { colorMode } = useColorMode();
  const size = useWindowSize();
  const smallWindow = createMemo(() => size.width < 768);

  const [topRef, setTopRef] = createSignal<HTMLDivElement>();
  const isTopVisible = createVisibilityObserver({
    initialValue: true
  })(topRef);

  return (
    <>
      <div ref={setTopRef} />
      <div class="h-20" />
      <nav
        class={cn(
          'fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-b-border bg-background py-6 pl-2 pr-4 transition-all duration-300 ease-in-out',
          !isTopVisible() && 'shadow-md'
        )}
      >
        <div class="flex w-1/3 justify-start md:hidden">
          <NavigationDrawer />
        </div>
        <div class="flex w-1/3 justify-center md:justify-start">
          <A href="/">
            {smallWindow() ? (
              <LogoSmall width={128} height={64} />
            ) : (
              <Logo width={256} height={64} />
            )}
          </A>
        </div>
        <div class="hidden w-1/3 justify-center md:flex">
          <div class="flex w-full place-items-center justify-center">
            <Menu orientation="horizontal" />
          </div>
        </div>
        <div class="flex w-1/3 justify-end">
          <ClerkLoaded>
            <SignedIn>
              <UserButton
                showName={!smallWindow()}
                appearance={{
                  baseTheme: colorMode() === 'dark' ? dark : undefined,
                  elements: {
                    userButtonOuterIdentifier: 'text-foreground'
                  }
                }}
              />
            </SignedIn>
            <SignedOut>
              <Button as={SignInButton} mode="modal" forceRedirectUrl={location.pathname} />
            </SignedOut>
          </ClerkLoaded>
          <ClerkLoading>
            <Spinner variant="default" size="sm" />
          </ClerkLoading>
        </div>
      </nav>
    </>
  );
}
