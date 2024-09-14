import { ClerkProvider as DefaultClerkProvider } from 'clerk-solidjs/start';
import type { JSXElement } from 'solid-js';
import { dark } from '@clerk/themes';
import { useColorMode } from '@kobalte/core';

export const ClerkProvider = (props: { children: JSXElement }) => {
  const { colorMode } = useColorMode();
  return (
    <DefaultClerkProvider
      publishableKey={import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: colorMode() === 'dark' ? dark : undefined,
      }}
    >
      {props.children}
    </DefaultClerkProvider>
  );
};
