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
import { isServer } from 'solid-js/web';

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
          const url = `${import.meta.env.PUBLIC_WEBAPP_URL}${pathname}${location.search}`;
          posthogClient()?.capture('$pageview', {
            $current_url: url,
          });
        }
        setPreviousPathname(pathname);
      },
    ),
  );

  useBeforeLeave(({ from, to }) => {
    if (from.pathname !== to) {
      const url = `${import.meta.env.PUBLIC_WEBAPP_URL}${from.pathname}${from.search}`;
      posthogClient()?.capture('$pageleave', {
        $current_url: url,
      });
    }
  });

  onMount(async () => {
    if (isServer) return;
    const isDev = import.meta.env.PUBLIC_DEV === 'true';
    const isProd = import.meta.env.PUBLIC_STAGE === 'production';
    if (!isDev) {
      const { default: posthog } = await import('posthog-js');
      const posthogClient = posthog.init(import.meta.env.PUBLIC_POSTHOG_API_KEY, {
        api_host: import.meta.env.PUBLIC_POSTHOG_API_HOST,
        ui_host: import.meta.env.PUBLIC_POSTHOG_UI_HOST,
        person_profiles: 'always',
        capture_pageview: false,
      });
      if (!isProd) {
        posthogClient.opt_out_capturing();
      }
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
