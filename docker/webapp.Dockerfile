ARG sentry_org="the-ai-study-bible"
ARG sentry_project="javascript-solidstart"
ARG sentry_release="production"
ARG sentry_auth_token

FROM oven/bun:1-slim AS build

USER root

RUN apt update && apt install -y git

WORKDIR /build

COPY . .

RUN bun install --frozen-lockfile

ENV SENTRY_ORG=$sentry_org
ENV SENTRY_PROJECT=$sentry_project
ENV SENTRY_RELEASE=$sentry_release
ENV SENTRY_AUTH_TOKEN=$sentry_auth_token

RUN cd apps/www && bun run build

################################################################################
FROM oven/bun:1-slim AS prod

WORKDIR /app

ENV NODE_ENV="production"

COPY --from=build /build/apps/www/.output .

EXPOSE 3000

CMD ["bun", "run", "./server/index.mjs"]
