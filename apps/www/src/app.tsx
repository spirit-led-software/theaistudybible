// @refresh reload
import { ColorModeProvider, ColorModeScript, cookieStorageManagerSSR } from '@kobalte/core';
import { Meta, MetaProvider, Title } from '@solidjs/meta';
import { FileRoutes } from '@solidjs/start/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools';
import { Suspense } from 'solid-js';
import { isServer } from 'solid-js/web';
import { Logo } from './components/branding/logo';
import { NotificationPromptDialog } from './components/notification-prompt-dialog';
import { SentryRouter } from './components/sentry/router';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/auth';
import { BibleProvider } from './contexts/bible';
import { ChatProvider } from './contexts/chat';
import { DevotionProvider } from './contexts/devotion';
import { PosthogProvider } from './contexts/posthog';
import { ServiceWorkerProvider } from './contexts/service-worker';
import { getColorModeCookie } from './server/cookie';

import '@fontsource/goldman/400.css';
import '@fontsource/goldman/700.css';
import '@fontsource-variable/inter';
import './app.css';

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        staleTime: 1000 * 10, // Just enough to avoid refetching on the client
        experimental_prefetchInRender: true,
      },
    },
  });

  const storageManager = cookieStorageManagerSSR(
    isServer ? getColorModeCookie().cookie : document.cookie,
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SolidQueryDevtools initialIsOpen={false} buttonPosition='bottom-left' />
      <SentryRouter
        explicitLinks
        root={(props) => (
          <PosthogProvider>
            <MetaProvider>
              <DefaultMetaTags />
              <ColorModeScript storageType={storageManager.type} />
              <ColorModeProvider storageManager={storageManager}>
                <ServiceWorkerProvider>
                  <AuthProvider>
                    <BibleProvider>
                      <ChatProvider>
                        <DevotionProvider>
                          <Suspense
                            fallback={
                              <div class='flex min-h-full w-full items-center justify-center'>
                                <div class='w-full max-w-xl'>
                                  <Logo />
                                </div>
                              </div>
                            }
                          >
                            {props.children}
                            <Toaster />
                            <NotificationPromptDialog />
                          </Suspense>
                        </DevotionProvider>
                      </ChatProvider>
                    </BibleProvider>
                  </AuthProvider>
                </ServiceWorkerProvider>
              </ColorModeProvider>
            </MetaProvider>
          </PosthogProvider>
        )}
      >
        <FileRoutes />
      </SentryRouter>
    </QueryClientProvider>
  );
}

const DefaultMetaTags = () => {
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
      <Meta name='theme-color' content='#030527' />
      <Meta name='robots' content='index, follow' />
    </>
  );
};
