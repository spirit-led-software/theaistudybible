FROM oven/bun:1-slim AS base

########################################################
# Install
########################################################
FROM base AS install

WORKDIR /install

COPY ./package.json ./package.json
COPY ./apps/functions/package.json ./apps/functions/package.json
COPY ./apps/www/package.json ./apps/www/package.json
COPY ./packages/ai/package.json ./packages/ai/package.json
COPY ./packages/core/package.json ./packages/core/package.json
COPY ./packages/schemas/package.json ./packages/schemas/package.json
COPY ./tools/scripts/package.json ./tools/scripts/package.json
COPY ./tools/tsconfig/package.json ./tools/tsconfig/package.json
COPY ./bun.lockb ./bun.lockb

RUN bun install --frozen-lockfile

########################################################
# Build
########################################################
FROM base AS build

ARG website_url
ARG cdn_url
ARG stripe_publishable_key
ARG stage

WORKDIR /build

RUN apt update \
&& apt install -y git \
&& rm -rf /var/lib/apt/lists/* \
&& apt clean

COPY --from=install /install/node_modules ./node_modules

ENV PUBLIC_WEBSITE_URL=${website_url}
ENV PUBLIC_CDN_URL=${cdn_url}
ENV PUBLIC_STRIPE_PUBLISHABLE_KEY=${stripe_publishable_key}
ENV PUBLIC_STAGE=${stage}

COPY . .
RUN bun run build

########################################################
# Release
########################################################
FROM base AS release

WORKDIR /app

ENV NODE_ENV="production"

COPY --from=build /build/apps/www/.output .

ENTRYPOINT [ "bun", "run", "./server/index.mjs" ]
EXPOSE 3000
