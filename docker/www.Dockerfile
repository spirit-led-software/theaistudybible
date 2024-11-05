FROM oven/bun:1-slim AS base

########################################################
# Install
########################################################
FROM base AS install

WORKDIR /install

RUN apt update \
&& apt install -y unzip \
&& rm -rf /var/lib/apt/lists/* \
&& apt clean

COPY --link ./package.json ./package.json
COPY --link ./apps/functions/package.json ./apps/functions/package.json
COPY --link ./apps/workers/package.json ./apps/workers/package.json
COPY --link ./apps/www/package.json ./apps/www/package.json
COPY --link ./packages/ai/package.json ./packages/ai/package.json
COPY --link ./packages/core/package.json ./packages/core/package.json
COPY --link ./packages/schemas/package.json ./packages/schemas/package.json
COPY --link ./tools/scripts/package.json ./tools/scripts/package.json
COPY --link ./tools/tsconfig/package.json ./tools/tsconfig/package.json
COPY --link ./bun.lockb ./bun.lockb

RUN bun install --frozen-lockfile

########################################################
# Build
########################################################
FROM base AS build

ARG webapp_url
ARG cdn_url
ARG posthog_api_host
ARG posthog_api_key
ARG stripe_publishable_key
ARG stage

ARG sentry_dsn
ARG sentry_org
ARG sentry_project_id
ARG sentry_project_name
ARG sentry_auth_token

WORKDIR /build

RUN apt update \
&& apt install -y git \
&& rm -rf /var/lib/apt/lists/* \
&& apt clean

COPY --from=install /install/node_modules ./node_modules

ENV PUBLIC_WEBAPP_URL=${webapp_url}
ENV PUBLIC_CDN_URL=${cdn_url}
ENV PUBLIC_POSTHOG_API_HOST=${posthog_api_host}
ENV PUBLIC_POSTHOG_API_KEY=${posthog_api_key}
ENV PUBLIC_STRIPE_PUBLISHABLE_KEY=${stripe_publishable_key}
ENV PUBLIC_STAGE=${stage}

ENV PUBLIC_SENTRY_DSN=${sentry_dsn}
ENV PUBLIC_SENTRY_ORG=${sentry_org}
ENV PUBLIC_SENTRY_PROJECT_ID=${sentry_project_id}
ENV PUBLIC_SENTRY_PROJECT_NAME=${sentry_project_name}
ENV SENTRY_AUTH_TOKEN=${sentry_auth_token}

COPY --link . .
RUN bun run build

########################################################
# Release
########################################################
FROM base AS release

WORKDIR /app

ENV NODE_ENV production
ENV PORT 8080

RUN apt update \
&& apt install -y curl \
&& rm -rf /var/lib/apt/lists/* \
&& apt clean

COPY --from=build /build/apps/www/.output .

COPY --link ./apps/www/instrument.mjs ./server/
RUN cd server \
&& bun add @sentry/bun posthog-node \
&& bun install --frozen-lockfile \
&& bun pm cache rm

ENTRYPOINT [ "bun", "run", "--smol", "--preload", "./server/instrument.mjs", "./server/index.mjs" ]
EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=15s --retries=5 --start-period=30s \
  CMD curl -f http://localhost:${PORT}/health || exit 1
