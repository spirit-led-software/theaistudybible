FROM oven/bun:1-slim AS base

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
COPY --link ./packages/schemas/package.json ./packages/schemas/package.json
COPY --link ./tools/scripts/package.json ./tools/scripts/package.json
COPY --link ./tools/tsconfig/package.json ./tools/tsconfig/package.json
COPY --link ./bun.lockb ./bun.lockb

RUN bun install --frozen-lockfile

########################################################
# Build
########################################################
FROM base AS build

ARG aws_access_key_id
ARG aws_secret_access_key
ARG aws_default_region
ARG assets_bucket

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

ENV AWS_ACCESS_KEY_ID ${aws_access_key_id}
ENV AWS_SECRET_ACCESS_KEY ${aws_secret_access_key}
ENV AWS_DEFAULT_REGION ${aws_default_region}

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

WORKDIR /build

RUN apt-get -qq update && \
    apt-get -qq install -y git curl unzip && \
    curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip -q awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip aws /var/lib/apt/lists/*

COPY --from=install /install/node_modules ./node_modules

COPY --link . .
RUN bun run build

# Remove the source map files from the output directory, then sync the assets to S3
RUN rm -rf ./apps/www/.output/**/*.map && \
    aws s3 sync ./apps/www/.output/public s3://${assets_bucket} \
        --metadata-directive 'REPLACE' \
        --cache-control 'public,max-age=0,s-maxage=86400,stale-while-revalidate=86400'

########################################################
# Release
########################################################
FROM base AS release

ARG port 8080

ENV NODE_ENV production
ENV PORT ${port}

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

WORKDIR /app

RUN apt-get -qq update && \
    apt-get -qq install -y curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /build/apps/www/.output/server .
COPY --link ./apps/www/instrument.mjs ./

RUN bun add --trust @sentry/bun posthog-node && \
    bun pm cache rm

ENTRYPOINT [ "bun","run", "--smol", "--preload", "./instrument.mjs", "./index.mjs" ]
EXPOSE ${PORT}

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=20s \
  CMD curl -f http://localhost:${PORT}/health || exit 1