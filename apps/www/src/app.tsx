// @refresh reload
import {
  COLOR_MODE_STORAGE_KEY,
  ColorModeProvider,
  ColorModeScript,
  cookieStorageManagerSSR,
} from '@kobalte/core';
import { withSentryRouterRouting } from '@sentry/solid/solidrouter';
import { MultiProvider } from '@solid-primitives/context';
import { Meta, MetaProvider, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { Suspense, isServer } from 'solid-js/web';
import { getCookie } from 'vinxi/http';
import Logo from './components/branding/logo';
import { SentryErrorBoundary } from './components/error-boundary';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { H1, H3 } from './components/ui/typography';
import { AuthProvider } from './contexts/auth';
import { BibleProvider } from './contexts/bible';
import { ChatProvider } from './contexts/chat';
import { DevotionProvider } from './contexts/devotion';
import '@fontsource/goldman';
import '@fontsource-variable/inter';
import './app.css';

const SentryRouter = withSentryRouterRouting(Router);

export function getServerCookies() {
  'use server';
  const colorMode = getCookie(COLOR_MODE_STORAGE_KEY);
  return colorMode ? `${COLOR_MODE_STORAGE_KEY}=${colorMode}` : '';
}

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 5,
        staleTime: 1000 * 60 * 5,
        experimental_prefetchInRender: true,
      },
    },
  });
  const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie);

  return (
    <MetaProvider>
      <Title>The AI Study Bible</Title>
      <Meta
        name='description'
        content='The AI Study Bible is a digital study Bible that uses artificial intelligence to help you study the Bible.'
      />
      <QueryClientProvider client={queryClient}>
        <ColorModeScript storageType={storageManager.type} />
        <ColorModeProvider storageManager={storageManager} initialColorMode='system'>
          <SentryRouter
            root={(props) => (
              <SentryErrorBoundary
                fallback={(err, reset) => (
                  <div class='flex h-full w-full items-center justify-center'>
                    <div class='flex w-full max-w-xl flex-col gap-3'>
                      <H1>Oops, something went wrong</H1>
                      <H3>{err.message}</H3>
                      <Button onClick={reset}>Try again</Button>
                    </div>
                  </div>
                )}
              >
                <Suspense
                  fallback={
                    <div class='flex h-full w-full items-center justify-center'>
                      <div class='w-full max-w-xl'>
                        <Logo />
                      </div>
                    </div>
                  }
                >
                  <AuthProvider>
                    <MultiProvider values={[BibleProvider, ChatProvider, DevotionProvider]}>
                      {props.children}
                      <Toaster />
                    </MultiProvider>
                  </AuthProvider>
                </Suspense>
              </SentryErrorBoundary>
            )}
          >
            <FileRoutes />
          </SentryRouter>
        </ColorModeProvider>
      </QueryClientProvider>
    </MetaProvider>
  );
}
