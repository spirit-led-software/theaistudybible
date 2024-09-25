FROM oven/bun:1-slim AS builder

ARG sentry_auth_token
ARG website_url
ARG cdn_url
ARG stripe_publishable_key
ARG stage

RUN apt update \
&& apt install -y git \
&& rm -rf /var/lib/apt/lists/* \
&& apt clean

WORKDIR /build

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

ENV SENTRY_RELEASE=${stage}
ENV SENTRY_AUTH_TOKEN=${sentry_auth_token}
ENV PUBLIC_WEBSITE_URL=${website_url}
ENV PUBLIC_CDN_URL=${cdn_url}
ENV PUBLIC_STRIPE_PUBLISHABLE_KEY=${stripe_publishable_key}
ENV PUBLIC_STAGE=${stage}

COPY . .
RUN bun run build

########################################################
FROM oven/bun:1-slim

WORKDIR /app

ENV NODE_ENV="production"

COPY --from=builder /build/apps/www/.output .

EXPOSE 3000

CMD ["bun", "run", "./server/index.mjs"]
