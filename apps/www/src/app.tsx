import { ColorModeProvider, ColorModeScript, cookieStorageManagerSSR } from '@kobalte/core';
import { MultiProvider } from '@solid-primitives/context';
import { MetaProvider } from '@solidjs/meta';
import { A, Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { ClerkProvider } from 'clerk-solidjs';
import { ErrorBoundary, Suspense, isServer } from 'solid-js/web';
import { getCookie } from 'vinxi/http';
import { Button } from './components/ui/button';
import { Toaster as Sonner } from './components/ui/sonner';
import { Toaster } from './components/ui/toast';
import { H1, H4 } from './components/ui/typography';
import { BibleProvider } from './contexts/bible';
import { ChatProvider } from './contexts/chat';
import { DevotionProvider } from './contexts/devotion';

import './app.css';

export function getServerCookies() {
  'use server';
  const colorMode = getCookie('kb-color-mode');
  return colorMode ? `kb-color-mode=${colorMode}` : '';
}

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 5,
        staleTime: 1000 * 60 * 5,
      },
    },
  });
  const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie);

  return (
    <QueryClientProvider client={queryClient}>
      <Router
        root={(props) => (
          <MetaProvider>
            <ClerkProvider publishableKey={import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY}>
              <ColorModeScript storageType={storageManager.type} />
              <ColorModeProvider storageManager={storageManager}>
                <MultiProvider values={[BibleProvider, ChatProvider, DevotionProvider]}>
                  <ErrorBoundary
                    fallback={(err, reset) => (
                      <div class='flex h-full w-full flex-col items-center justify-center space-y-2'>
                        <H1>Error</H1>
                        <H4 class='max-w-sm text-center'>{err.message}</H4>
                        <div class='flex space-x-2'>
                          <Button onClick={reset}>Retry</Button>
                          <Button as={A} href='/'>
                            Go Home Instead
                          </Button>
                        </div>
                      </div>
                    )}
                  >
                    <Suspense>{props.children}</Suspense>
                  </ErrorBoundary>
                  <Toaster />
                  <Sonner />
                </MultiProvider>
              </ColorModeProvider>
            </ClerkProvider>
          </MetaProvider>
        )}
      >
        <FileRoutes />
      </Router>
    </QueryClientProvider>
  );
}
