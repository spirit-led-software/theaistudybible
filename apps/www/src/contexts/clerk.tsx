import { ClerkProvider as DefaultClerkProvider } from 'clerk-solidjs';
import type { JSXElement } from 'solid-js';
import { dark } from '@clerk/themes';
import { useColorMode } from '@kobalte/core';
import { useNavigate } from '@solidjs/router';

export const ClerkProvider = (props: { children: JSXElement }) => {
  const navigate = useNavigate();
  const { colorMode } = useColorMode();
  return (
    <DefaultClerkProvider
      publishableKey={import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: colorMode() === 'dark' ? dark : undefined,
      }}
      routerPush={(path) => navigate(path)}
      routerReplace={(path) => navigate(path, { replace: true })}
    >
      {props.children}
    </DefaultClerkProvider>
  );
};
