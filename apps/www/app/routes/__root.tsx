import appCss from '@/www/styles/globals.css?url';
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { ReactNode } from 'react';
import { NotificationPromptDialog } from '../components/notification-prompt-dialog';
import { Toaster } from '../components/ui/sonner';
import { BibleProvider } from '../contexts/bible';
import { ChatProvider } from '../contexts/chat';
import { DevotionProvider } from '../contexts/devotion';
import { ServiceWorkerProvider } from '../contexts/service-worker';
import { getAuth } from '../server/functions/auth';
import { getSubscription } from '../server/functions/pro';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async () => {
    const [{ auth }, { subscription, type }] = await Promise.all([getAuth(), getSubscription()]);
    return { auth, subscription, subscriptionType: type };
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
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ServiceWorkerProvider>
          <BibleProvider>
            <ChatProvider>
              <DevotionProvider>
                {children}
                <Toaster />
                <NotificationPromptDialog />
                {/* <PosthogInit /> */}
              </DevotionProvider>
            </ChatProvider>
          </BibleProvider>
        </ServiceWorkerProvider>
        <TanStackRouterDevtools position='bottom-right' />
        <ReactQueryDevtools buttonPosition='bottom-left' />
        <Scripts />
      </body>
    </html>
  );
}
