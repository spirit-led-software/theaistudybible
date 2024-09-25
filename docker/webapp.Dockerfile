FROM oven/bun:1-slim AS build

ARG sentry_auth_token
ARG website_url
ARG cdn_url
ARG stripe_publishable_key
ARG stage

USER root

RUN apt update && apt install -y git

WORKDIR /build

ENV SENTRY_RELEASE=${stage}
ENV SENTRY_AUTH_TOKEN=${sentry_auth_token}
ENV PUBLIC_WEBSITE_URL=${website_url}
ENV PUBLIC_CDN_URL=${cdn_url}
ENV PUBLIC_STRIPE_PUBLISHABLE_KEY=${stripe_publishable_key}
ENV PUBLIC_STAGE=${stage}

COPY . .

RUN bun install --frozen-lockfile

RUN bun run build

FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV="production"

COPY --from=build /build/apps/www/.output .

EXPOSE 3000

CMD ["bun", "run", "./server/index.mjs"]
