import type { PostHog } from 'posthog-node';

export const getPosthog = (): PostHog | undefined => globalThis.posthog;

export const setPosthog = (posthog: PostHog | undefined) => {
  globalThis.posthog = posthog;
};
