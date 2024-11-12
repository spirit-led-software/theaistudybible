FROM oven/bun:1-slim AS base

########################################################
# Install
########################################################
FROM base AS install

WORKDIR /app

COPY --link ./apps/www/.output/server .

RUN bun install --frozen-lockfile && \
    bun add --trust @sentry/bun posthog-node && \
    bun pm cache rm

########################################################
# Release
########################################################
FROM base AS release

ENV NODE_ENV production
ENV PORT 8080

WORKDIR /app

RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=install /app .
COPY --link ./apps/www/instrument.mjs ./

ENTRYPOINT [ "bun", "run", "--smol", "--preload", "./instrument.mjs", "./index.mjs" ]
EXPOSE ${PORT}

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=20s \
  CMD curl -f http://localhost:${PORT}/health || exit 1
