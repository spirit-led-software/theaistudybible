import { useRouter } from '@tanstack/react-router';
import type { PostHog } from 'posthog-js';
import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

// Create context with explicit initialization
const PosthogContext = createContext<PostHog | undefined>(undefined);

type PosthogProviderProps = {
  children: ReactNode;
};

export const PosthogProvider = ({ children }: PosthogProviderProps) => {
  const [posthogClient, setPosthogClient] = useState<PostHog | undefined>();
  const previousPathnameRef = useRef<string>('');
  const router = useRouter();

  // Initialize PostHog client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('posthog-js').then((posthog) => {
        const client = posthog.default.init(import.meta.env.PUBLIC_POSTHOG_KEY || '', {
          api_host: import.meta.env.PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: true,
          disable_session_recording: true,
          bootstrap: {
            distinctID: import.meta.env.PUBLIC_POSTHOG_DISTINCT_ID || '',
          },
        });
        setPosthogClient(client);
      });
    }
  }, []);

  // Set up Sentry integration
  useEffect(() => {
    if (posthogClient && typeof window !== 'undefined') {
      import('@sentry/react').then((sentry) => {
        const sentryIntegration = posthogClient.sentryIntegration({
          organization: import.meta.env.PUBLIC_SENTRY_ORG,
          projectId: Number.parseInt(import.meta.env.PUBLIC_SENTRY_PROJECT_ID),
        });
        sentry.addIntegration(sentryIntegration);
      });
    }
  }, [posthogClient]);

  // Track page views
  useEffect(() => {
    const unsubscribe = router.subscribe('onRendered', (event) => {
      const pathname = event.toLocation.pathname;
      const search = event.toLocation.search;

      if (previousPathnameRef.current !== pathname) {
        const url = `${import.meta.env.PUBLIC_WEBAPP_URL}${pathname}${search}`;
        posthogClient?.capture('$pageview', {
          $current_url: url,
        });
      }

      previousPathnameRef.current = pathname;
    });

    return () => {
      unsubscribe();
    };
  }, [posthogClient, router]);

  return <PosthogContext.Provider value={posthogClient}>{children}</PosthogContext.Provider>;
};

export const usePosthog = (): PostHog | undefined => {
  return useContext(PosthogContext);
};
