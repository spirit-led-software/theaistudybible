import appCss from '@/www/styles/globals.css?url';
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { ReactNode } from 'react';
import { DefaultErrorComponent } from '../components/default-error';
import { NotFoundComponent } from '../components/not-found';
import { NotificationPromptDialog } from '../components/notification-prompt-dialog';
import { Toaster } from '../components/ui/sonner';
import { BibleProvider } from '../contexts/bible';
import { ChatProvider } from '../contexts/chat';
import { DevotionProvider } from '../contexts/devotion';
import { PosthogProvider } from '../contexts/posthog';
import { ServiceWorkerProvider } from '../contexts/service-worker';
import { getAuth } from '../server/functions/auth';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async () => {
    const { auth } = await getAuth();
    return { auth };
  },
  head: () => {
    return {
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          title: 'The AI Study Bible',
        },
      ],
      links: [
        {
          rel: 'stylesheet',
          href: appCss,
        },
      ],
    };
  },
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultErrorComponent {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => (
    <RootDocument>
      <NotFoundComponent />
    </RootDocument>
  ),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <ServiceWorkerProvider>
          <PosthogProvider>
            <BibleProvider>
              <ChatProvider>
                <DevotionProvider>
                  {children}
                  <Toaster />
                  <NotificationPromptDialog />
                </DevotionProvider>
              </ChatProvider>
            </BibleProvider>
          </PosthogProvider>
        </ServiceWorkerProvider>
        <TanStackRouterDevtools position='bottom-right' />
        <ReactQueryDevtools buttonPosition='bottom-left' />
        <Scripts />
      </body>
    </html>
  );
}
