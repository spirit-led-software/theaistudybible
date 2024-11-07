import * as Sentry from '@sentry/solidstart';
import { useLocation } from '@solidjs/router';
import posthog, { type PostHog } from 'posthog-js';
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
    on(posthogClient, (posthogClient) => {
      if (posthogClient) {
        Sentry.addIntegration(
          posthogClient.sentryIntegration({
            organization: import.meta.env.PUBLIC_SENTRY_ORG,
            projectId: Number.parseInt(import.meta.env.PUBLIC_SENTRY_PROJECT_ID),
          }),
        );
      }
    }),
  );

  const location = useLocation();
  createEffect(() => {
    posthogClient()?.capture('$pageview', {
      $current_url: `${location.pathname}${location.search}`,
    });
  });

  onMount(() => {
    const posthogClient = posthog.init(import.meta.env.PUBLIC_POSTHOG_API_KEY, {
      api_host: import.meta.env.PUBLIC_POSTHOG_API_HOST,
      ui_host: import.meta.env.PUBLIC_POSTHOG_UI_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: true,
      loaded: () => {
        if (import.meta.env.PUBLIC_STAGE !== 'production') {
          posthog.opt_out_capturing();
          posthog.set_config({ disable_session_recording: true });
        }
      },
    });
    setPosthogClient(posthogClient);
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
