type Env = {
  SENTRY_DSN: string;
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathWithParams = `${url.pathname}${url.search}`;
    return await fetch(`${env.SENTRY_DSN}${pathWithParams}`, request);
  },
} satisfies ExportedHandler<Env>;
