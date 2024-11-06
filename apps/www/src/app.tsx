// @refresh reload
import {
  COLOR_MODE_STORAGE_KEY,
  ColorModeProvider,
  ColorModeScript,
  createCookieStorageManager,
  useColorModeValue,
} from '@kobalte/core';
import * as Sentry from '@sentry/solidstart';
import { Meta, MetaProvider, Title } from '@solidjs/meta';
import { FileRoutes } from '@solidjs/start/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools';
import { Show, Suspense } from 'solid-js';
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
          Sentry.captureException(error, {
            data: {
              queryKey: query.queryKey,
              queryHash: query.queryHash,
              queryState: query.state,
              queryOptions: query.options,
              queryMeta: query.meta,
            },
          });
          return query.state.data === undefined;
        },
      },
      mutations: {
        throwOnError: (error) => {
          Sentry.captureException(error);
          return true;
        },
      },
    },
  });

  const storageManager = createCookieStorageManager(
    COLOR_MODE_STORAGE_KEY,
    isServer ? getColorModeCookie() : undefined,
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SolidQueryDevtools initialIsOpen={false} buttonPosition='top-left' />
      <SentryRouter
        root={(props) => (
          <MetaProvider>
            <ColorModeScript storageType={storageManager.type} />
            <ColorModeProvider storageManager={storageManager} initialColorMode='system'>
              <DefaultMetaTags />
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

const DefaultMetaTags = () => {
  const themeColor = useColorModeValue('#FFFFFF', '#030527');
  const title = 'The AI Study Bible - Intelligent Bible Study Assistant';
  const description =
    'Study the Bible with AI-powered insights, verse explanations, and personalized devotionals. Access multiple translations, create highlights, notes, and bookmarks.';

  return (
    <>
      <Title>{title}</Title>

      {/* Core meta tags */}
      <Meta name='description' content={description} />
      <Meta
        name='keywords'
        content='Bible study, AI Bible assistant, digital Bible, Bible commentary, Bible translations, Bible devotionals'
      />

      {/* Open Graph tags for social sharing */}
      <Meta property='og:type' content='website' />
      <Meta property='og:title' content={title} />
      <Meta property='og:description' content={description} />
      <Meta property='og:site_name' content='The AI Study Bible' />

      {/* Twitter Card tags */}
      <Meta name='twitter:card' content='summary_large_image' />
      <Meta name='twitter:title' content={title} />
      <Meta name='twitter:description' content={description} />

      {/* Additional meta tags */}
      <Meta name='application-name' content='The AI Study Bible' />
      <Meta name='theme-color' content={themeColor()} />
      <Meta name='robots' content='index, follow' />
    </>
  );
};
