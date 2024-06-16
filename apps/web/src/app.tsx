import { ColorModeProvider, ColorModeScript, cookieStorageManagerSSR } from '@kobalte/core';
import { Meta, MetaProvider, Title } from '@solidjs/meta';
import { A, Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools';
import { ErrorBoundary, Show, Suspense, isServer } from 'solid-js/web';
import { getCookie } from 'vinxi/http';
import NavigationHeader from './components/nav/header';
import { ClerkProvider } from './components/providers/clerk';
import { Button } from './components/ui/button';
import { Spinner } from './components/ui/spinner';
import { Toaster } from './components/ui/toast';
import { H1, H4 } from './components/ui/typography';

import './app.css';
import { BibleProvider } from './components/providers/bible';

export function getServerCookies() {
  'use server';
  const colorMode = getCookie('kb-color-mode');
  return colorMode ? `kb-color-mode=${colorMode}` : '';
}

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity
      }
    }
  });
  const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie);

  return (
    <QueryClientProvider client={queryClient}>
      <SolidQueryDevtools />
      <Router
        root={(props) => (
          <MetaProvider>
            <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
              <ColorModeScript storageType={storageManager.type} />
              <ColorModeProvider storageManager={storageManager}>
                <BibleProvider>
                  <Title>The AI Study Bible</Title>
                  <Meta name="description">
                    The AI Study Bible is a digital study Bible that uses artificial intelligence to
                    help you study the Bible.
                  </Meta>
                  <ErrorBoundary
                    fallback={(err, reset) => (
                      <div class="flex h-dvh w-full flex-col items-center justify-center space-y-2">
                        <H1>Error</H1>
                        <H4 class="max-w-sm text-center">{err.message}</H4>
                        <div class="flex space-x-2">
                          <Button onClick={reset}>Retry</Button>
                          <Button as={A} href="/">
                            Go Home Instead
                          </Button>
                        </div>
                      </div>
                    )}
                  >
                    <Suspense
                      fallback={
                        <div class="flex h-dvh w-full flex-col items-center justify-center">
                          <Spinner />
                        </div>
                      }
                    >
                      <main class="flex min-h-dvh w-full flex-col">
                        <Show when={props.location.pathname !== '/'}>
                          <NavigationHeader />
                        </Show>
                        {props.children}
                      </main>
                    </Suspense>
                  </ErrorBoundary>
                  <Toaster />
                </BibleProvider>
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
