import { useBeforeLeave, useLocation } from '@solidjs/router';
import type { PostHog } from 'posthog-js';
import {
  type Accessor,
  type JSX,
  createContext,
  createEffect,
  createSignal,
  on,
  onMount,
  useContext,
} from 'solid-js';

const PosthogContext = createContext<Accessor<PostHog | undefined> | null>(null);

export const PosthogProvider = (props: { children: JSX.Element }) => {
  const [posthogClient, setPosthogClient] = createSignal<PostHog>();
  createEffect(
    on(posthogClient, async (posthogClient) => {
      if (posthogClient) {
        const { addIntegration } = await import('@sentry/solidstart');
        addIntegration(
          posthogClient.sentryIntegration({
            organization: import.meta.env.PUBLIC_SENTRY_ORG,
            projectId: Number.parseInt(import.meta.env.PUBLIC_SENTRY_PROJECT_ID),
          }),
        );
      }
    }),
  );

  const [previousPathname, setPreviousPathname] = createSignal<string>();
  const location = useLocation();
  createEffect(
    on(
      () => location.pathname,
      (pathname) => {
        if (previousPathname() !== pathname) {
          posthogClient()?.capture('$pageview');
        }
        setPreviousPathname(pathname);
      },
    ),
  );

  useBeforeLeave((options) => {
    if (options.from.pathname !== options.to) {
      posthogClient()?.capture('$pageleave');
    }
  });

  onMount(async () => {
    const isDev = import.meta.env.PUBLIC_DEV === 'true';
    if (!isDev) {
      const { default: posthog } = await import('posthog-js');
      const posthogClient = posthog.init(import.meta.env.PUBLIC_POSTHOG_API_KEY, {
        api_host: import.meta.env.PUBLIC_POSTHOG_API_HOST,
        ui_host: import.meta.env.PUBLIC_POSTHOG_UI_HOST,
        person_profiles: 'always',
        capture_pageview: false,
        capture_pageleave: true,
      });
      setPosthogClient(posthogClient);
    }
  });

  return <PosthogContext.Provider value={posthogClient}>{props.children}</PosthogContext.Provider>;
};

export const usePosthog = () => {
  const ctx = useContext(PosthogContext);
  if (!ctx) {
    throw new Error('usePosthog must be used within a PosthogProvider');
  }
  return ctx;
};
