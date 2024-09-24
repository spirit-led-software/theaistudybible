ARG SENTRY_ORG="the-ai-study-bible"
ARG SENTRY_PROJECT="javascript-solidstart"
ARG SENTRY_RELEASE="production"
ARG SENTRY_AUTH_TOKEN

FROM oven/bun:1-slim AS build

USER root

RUN apt update && apt install -y git

WORKDIR /build

ENV SENTRY_ORG="${SENTRY_ORG}"
ENV SENTRY_PROJECT="${SENTRY_PROJECT}"
ENV SENTRY_RELEASE="${SENTRY_RELEASE}"
ENV SENTRY_AUTH_TOKEN="${SENTRY_AUTH_TOKEN}"

COPY . .

RUN bun install --frozen-lockfile

RUN bun run build

################################################################################
FROM oven/bun:1-slim AS prod

WORKDIR /app

ENV NODE_ENV="production"

COPY --from=build /build/apps/www/.output .

EXPOSE 3000

CMD ["bun", "run", "./server/index.mjs"]
