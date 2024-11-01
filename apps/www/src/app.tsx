// @refresh reload
import {
  COLOR_MODE_STORAGE_KEY,
  ColorModeProvider,
  ColorModeScript,
  createCookieStorageManager,
} from '@kobalte/core';
import * as Sentry from '@sentry/solidstart';
import { Meta, MetaProvider, Title } from '@solidjs/meta';
import { FileRoutes } from '@solidjs/start/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools';
import posthog from 'posthog-js';
import { Show, Suspense, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import { Logo } from './components/branding/logo';
import { SentryErrorBoundary } from './components/sentry/error-boundary';
import { SentryRouter } from './components/sentry/router';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { H1, H3, H4 } from './components/ui/typography';
import { AuthProvider } from './contexts/auth';
import { BibleProvider } from './contexts/bible';
import { ChatProvider } from './contexts/chat';
import { DevotionProvider } from './contexts/devotion';
import { getColorModeCookie } from './server/cookie';

import '@fontsource/goldman';
import '@fontsource-variable/inter';
import './app.css';

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        experimental_prefetchInRender: true,
        // This is just the default with added Sentry capture
        // this seems to be the only way to capture errors in solid-query
        // https://tanstack.com/query/latest/docs/framework/react/guides/suspense#throwonerror-default
        throwOnError: (error, query) => {
          Sentry.captureException(error);
          return query.state.data === undefined;
        },
      },
      mutations: {
        onError: (error) => {
          Sentry.captureException(error);
        },
      },
    },
  });

  const storageManager = createCookieStorageManager(
    COLOR_MODE_STORAGE_KEY,
    isServer ? getColorModeCookie() : undefined,
  );

  onMount(() => {
    posthog.init('phc_z3PcZTeDMCT53dKzb0aqDXkrM1o3LpNcC9QlJDdG9sO', {
      api_host: 'https://us.i.posthog.com',
      person_profiles: 'always',
      loaded: () => {
        if (import.meta.env.PUBLIC_STAGE !== 'production') {
          posthog.opt_out_capturing();
          posthog.set_config({ disable_session_recording: true });
        }
      },
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      <SolidQueryDevtools initialIsOpen={false} buttonPosition='top-left' />
      <SentryRouter
        root={(props) => (
          <MetaProvider>
            <Title>The AI Study Bible</Title>
            <Meta
              name='description'
              content='The AI Study Bible is a digital study Bible that uses artificial intelligence to help you study the Bible.'
            />
            <ColorModeScript storageType={storageManager.type} />
            <ColorModeProvider storageManager={storageManager} initialColorMode='system'>
              <AuthProvider>
                <BibleProvider>
                  <ChatProvider>
                    <DevotionProvider>
                      <SentryErrorBoundary
                        fallback={(err, reset) => (
                          <div class='flex h-full w-full items-center justify-center'>
                            <div class='flex w-full max-w-xl flex-col gap-3'>
                              <H1>Oops, something went wrong. Please contact support.</H1>
                              <H4>{err.message}</H4>
                              <Show when={err.stack} keyed>
                                {(stack) => (
                                  <pre class='max-h-80 overflow-y-auto whitespace-pre-wrap text-wrap rounded-xl bg-foreground/10 p-5 text-xs'>
                                    {stack}
                                  </pre>
                                )}
                              </Show>
                              <Show
                                when={'cause' in err && err.cause instanceof Error && err.cause}
                                keyed
                              >
                                {(cause) => <H3>{cause.message}</H3>}
                              </Show>
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
                          {props.children}
                        </Suspense>
                        <Toaster />
                      </SentryErrorBoundary>
                    </DevotionProvider>
                  </ChatProvider>
                </BibleProvider>
              </AuthProvider>
            </ColorModeProvider>
          </MetaProvider>
        )}
      >
        <FileRoutes />
      </SentryRouter>
    </QueryClientProvider>
  );
}
