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
ARG stripe_publishable_key
ARG stage

ARG sentry_dsn
ARG sentry_org
ARG sentry_project
ARG sentry_auth_token

WORKDIR /build

RUN apt update \
&& apt install -y git \
&& rm -rf /var/lib/apt/lists/* \
&& apt clean

COPY --from=install /install/node_modules ./node_modules

ENV PUBLIC_WEBAPP_URL=${webapp_url}
ENV PUBLIC_CDN_URL=${cdn_url}
ENV PUBLIC_STRIPE_PUBLISHABLE_KEY=${stripe_publishable_key}
ENV PUBLIC_STAGE=${stage}

ENV PUBLIC_SENTRY_DSN=${sentry_dsn}
ENV SENTRY_ORG=${sentry_org}
ENV SENTRY_PROJECT=${sentry_project}
ENV SENTRY_RELEASE=${stage}
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

COPY --link ./apps/www/sentry.plugin.ts ./server/
RUN cd server \
&& bun install \
&& bun add @sentry/bun \
&& bun pm cache rm

ENTRYPOINT [ "bun", "run", "--smol", "--preload", "./server/sentry.plugin.ts", "./server/index.mjs" ]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=15s --retries=5 --start-period=30s \
  CMD curl -f http://localhost:${PORT}/health || exit 1
