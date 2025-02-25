FROM oven/bun:1.2-slim AS base

########################################################
# Install
########################################################
FROM base AS install

WORKDIR /install

RUN apt-get -qq update && \
    apt-get -qq install -y unzip && \
    rm -rf /var/lib/apt/lists/*

COPY --link ./package.json ./package.json
COPY --link ./apps/functions/package.json ./apps/functions/package.json
COPY --link ./apps/workers/package.json ./apps/workers/package.json
COPY --link ./apps/www/package.json ./apps/www/package.json
COPY --link ./packages/ai/package.json ./packages/ai/package.json
COPY --link ./packages/core/package.json ./packages/core/package.json
COPY --link ./packages/email/package.json ./packages/email/package.json
COPY --link ./packages/schemas/package.json ./packages/schemas/package.json
COPY --link ./tools/scripts/package.json ./tools/scripts/package.json
COPY --link ./tools/tsconfig/package.json ./tools/tsconfig/package.json
COPY --link ./bun.lock ./bun.lock

RUN bun install --frozen-lockfile

########################################################
# Build
########################################################
FROM base AS build

ARG stage
ARG webapp_url
ARG cdn_url
ARG stripe_publishable_key

ARG posthog_ui_host
ARG posthog_api_host
ARG posthog_api_key

ARG sentry_dsn
ARG sentry_org
ARG sentry_project_id
ARG sentry_project_name
ARG sentry_auth_token

ARG donation_link

ENV PUBLIC_STAGE ${stage}
ENV PUBLIC_WEBAPP_URL ${webapp_url}
ENV PUBLIC_CDN_URL ${cdn_url}
ENV PUBLIC_STRIPE_PUBLISHABLE_KEY ${stripe_publishable_key}

ENV PUBLIC_POSTHOG_UI_HOST ${posthog_ui_host}
ENV PUBLIC_POSTHOG_API_HOST ${posthog_api_host}
ENV PUBLIC_POSTHOG_API_KEY ${posthog_api_key}

ENV PUBLIC_SENTRY_DSN ${sentry_dsn}
ENV PUBLIC_SENTRY_ORG ${sentry_org}
ENV PUBLIC_SENTRY_PROJECT_ID ${sentry_project_id}
ENV PUBLIC_SENTRY_PROJECT_NAME ${sentry_project_name}
ENV SENTRY_AUTH_TOKEN ${sentry_auth_token}

ENV PUBLIC_DONATION_LINK ${donation_link}

ENV NODE_ENV production

WORKDIR /build

RUN apt-get -qq update && \
    apt-get -qq install -y git && \
    rm -rf /var/lib/apt/lists/*

COPY --from=install /install/node_modules ./node_modules
COPY --link . .

WORKDIR /build/apps/www
RUN bun run build

########################################################
# Release
########################################################
FROM base AS release

ENV NODE_ENV production
ENV HOSTNAME 0.0.0.0
ENV PORT 8080

ENV PUBLIC_STAGE ${stage}
ENV PUBLIC_WEBAPP_URL ${webapp_url}
ENV PUBLIC_CDN_URL ${cdn_url}
ENV PUBLIC_STRIPE_PUBLISHABLE_KEY ${stripe_publishable_key}

ENV PUBLIC_POSTHOG_UI_HOST ${posthog_ui_host}
ENV PUBLIC_POSTHOG_API_HOST ${posthog_api_host}
ENV PUBLIC_POSTHOG_API_KEY ${posthog_api_key}

ENV PUBLIC_SENTRY_DSN ${sentry_dsn}
ENV PUBLIC_SENTRY_ORG ${sentry_org}
ENV PUBLIC_SENTRY_PROJECT_ID ${sentry_project_id}
ENV PUBLIC_SENTRY_PROJECT_NAME ${sentry_project_name}
ENV SENTRY_AUTH_TOKEN ${sentry_auth_token}

ENV PUBLIC_DONATION_LINK ${donation_link}

WORKDIR /app

RUN apt-get -qq update && \
    apt-get -qq install -y curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /build/apps/www/.output .

WORKDIR /app/server
ENTRYPOINT [ "bun", "run", "--preload", "./instrument.server.mjs", "./index.mjs" ]
EXPOSE ${PORT}
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=20s \
  CMD curl -f http://localhost:${PORT}/health || exit 1
