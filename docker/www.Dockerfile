FROM oven/bun:1-slim AS base

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

COPY --link ./apps/www/.output/server .
COPY --link ./apps/www/instrument.mjs ./

RUN bun install --frozen-lockfile && \
    bun add --trust @sentry/bun posthog-node && \
    bun pm trust --all && \
    bun pm cache rm

ENTRYPOINT [ "bun", "run", "--smol", "--preload", "./instrument.mjs", "./index.mjs" ]
EXPOSE ${PORT}

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=20s \
  CMD curl -f http://localhost:${PORT}/health || exit 1
