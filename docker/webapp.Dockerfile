ARG sentry_org="the-ai-study-bible"
ARG sentry_project="javascript-solidstart"
ARG sentry_auth_token
ARG website_url
ARG cdn_url
ARG stripe_publishable_key
ARG stage

FROM oven/bun:1-slim AS build

USER root

RUN apt update && apt install -y git

WORKDIR /build

ENV SENTRY_ORG=$sentry_org
ENV SENTRY_PROJECT=$sentry_project
ENV SENTRY_RELEASE=$stage
ENV SENTRY_AUTH_TOKEN=$sentry_auth_token
ENV PUBLIC_WEBSITE_URL=$website_url
ENV PUBLIC_CDN_URL=$cdn_url
ENV PUBLIC_STRIPE_PUBLISHABLE_KEY=$stripe_publishable_key
ENV PUBLIC_STAGE=$stage

COPY . .

RUN bun install --frozen-lockfile

RUN cd apps/www && bun run build

################################################################################
FROM oven/bun:1-slim AS prod

WORKDIR /app

ENV NODE_ENV="production"

COPY --from=build /build/apps/www/.output .

EXPOSE 3000

CMD ["bun", "run", "./server/index.mjs"]
