import { dark } from '@clerk/themes';
import { useColorMode } from '@kobalte/core';
import { A } from '@solidjs/router';
import { createMemo } from 'solid-js';
import { useWindowSize } from '~/hooks/window-size';
import Logo from '../branding/logo';
import LogoSmall from '../branding/logo-small';
import { ClerkLoading, SignInButton, SignedIn, SignedOut, UserButton } from '../clerk';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { NavigationSheet } from './sheet';

export default function NavigationHeader() {
  const { colorMode } = useColorMode();
  const windowSize = useWindowSize();
  const smallWindow = createMemo(() => windowSize().width < 768);

  return (
    <nav class="flex h-20 items-center justify-between border-b border-b-border py-6 pl-2 pr-4">
      <div class="flex w-1/3 justify-start md:hidden">
        <NavigationSheet />
      </div>
      <div class="flex w-1/3 justify-center md:justify-start">
        <A href="/">
          {smallWindow() ? <LogoSmall width={128} height={64} /> : <Logo width={256} height={64} />}
        </A>
      </div>
      <div class="hidden w-1/3 justify-center md:flex">
        <div class="flex w-full place-items-center justify-center">
          <Button as={A} href="/bible" variant={'ghost'}>
            Bible
          </Button>
          <Button as={A} href="/chat" variant={'ghost'}>
            Chat
          </Button>
        </div>
      </div>
      <div class="flex w-1/3 justify-end">
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
          <Button as={SignInButton} />
        </SignedOut>
        <ClerkLoading>
          <Spinner variant="default" size="sm" />
        </ClerkLoading>
      </div>
    </nav>
  );
}
