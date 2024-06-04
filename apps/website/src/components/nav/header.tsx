import { dark } from '@clerk/themes';
import { useColorMode } from '@kobalte/core';
import { A } from '@solidjs/router';
import { createMemo } from 'solid-js';
import { useWindowSize } from '~/hooks/window-size';
import { resolvedTailwindConfig } from '~/lib/theme/tailwind';
import Logo from '../branding/logo';
import LogoSmall from '../branding/logo-small';
import { ClerkLoading, SignIn, SignedIn, SignedOut, UserButton } from '../clerk';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { NavigationDrawer } from './drawer';

export default function NavigationHeader() {
  const { colorMode } = useColorMode();
  const windowSize = useWindowSize();
  const smallWindow = createMemo(
    () => windowSize().width < parseInt(resolvedTailwindConfig.theme.screens.md.split('px')[0])
  );

  return (
    <header class="flex h-20 items-center justify-between border-b border-b-border py-6 pl-2 pr-4">
      <div class="flex w-1/3 justify-start md:hidden">
        <NavigationDrawer />
      </div>
      <div class="flex w-1/3 justify-center md:justify-start">
        <A href="/">
          {smallWindow() ? <LogoSmall width={128} height={64} /> : <Logo width={256} height={64} />}
        </A>
      </div>
      <div class="hidden w-1/3 justify-center md:flex">
        <A href="/bible" class="w-full">
          <div class="flex w-full place-items-center justify-between">
            <div class="flex flex-col gap-1.5 p-4">
              <div class="text-lg font-semibold leading-none tracking-tight">Bible</div>
              <div class="text-sm text-muted-foreground">
                <A href="/bible">Bible</A>
              </div>
            </div>
            <div class="h-2 w-[100px] rounded-full bg-muted" />
          </div>
        </A>
        {/* <A href="/chat" class="w-full">
          <div class="flex w-full place-items-center justify-between">
            <div class="flex flex-col gap-1.5 p-4">                
              <div class="text-lg font-semibold leading-none tracking-tight">Chat</div>
              <div class="text-sm text-muted-foreground">
                <A href="/chat">Chat</A>
              </div>
            </div>
            <div class="h-2 w-[100px] rounded-full bg-muted" />
          </div>
        </A> */}
      </div>
      <div class="flex w-1/3 justify-end">
        <SignedIn>
          <UserButton
            showName={!smallWindow}
            appearance={{
              baseTheme: colorMode() === 'dark' ? dark : undefined,
              elements: {
                userButtonOuterIdentifier: 'text-foreground'
              }
            }}
          />
        </SignedIn>
        <SignedOut>
          <Button as={SignIn} />
        </SignedOut>
        <ClerkLoading>
          <Spinner variant="default" size="sm" />
        </ClerkLoading>
      </div>
    </header>
  );
}
