import { useEffect } from 'react';

export const PosthogInit = () => {
  useEffect(() => {
    import('posthog-js').then(({ default: posthog }) => {
      posthog.init(import.meta.env.PUBLIC_POSTHOG_API_KEY, {
        api_host: import.meta.env.PUBLIC_POSTHOG_API_HOST,
        disable_session_recording: true,
      });
      if (import.meta.env.PUBLIC_STAGE !== 'production') {
        posthog.opt_out_capturing();
      }
    });
  }, []);

  return null;
};
