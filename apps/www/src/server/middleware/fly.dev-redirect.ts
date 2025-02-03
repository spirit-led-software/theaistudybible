import type { RequestEvent } from 'solid-js/web';
import { Resource } from 'sst';

export const flyDevRedirectOnRequest = () => {
  return ({ request }: RequestEvent) => {
    if (request.url.includes('fly.dev')) {
      const url = new URL(request.url);
      return Response.redirect(`${Resource.WebAppUrl.value}${url.pathname}${url.search}`, 301);
    }
  };
};
