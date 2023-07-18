FROM docker.io/node:20.2.0 AS builder

ARG DATABASE_URL="postgres://revelationsai:revelationsai@localhost:5432/revelationsai"

WORKDIR /app

# Copy source files
COPY . /app

# Install dependencies
RUN npm i

# Generate Prisma dependencies
RUN npm run prisma:generate

# Build
RUN npm run build

FROM docker.io/node:20.2.0 AS runner

ENV HOST=0.0.0.0
ENV PORT=8080
ENV NODE_ENV=production

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

USER root

WORKDIR /app

# Install dependencies
RUN apt-get update -y \
  && apt-get install -y build-essential \
  # Chromium dependencies
  chromium ca-certificates fonts-liberation libasound2 \
  libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 \
  libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 \
  libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
  libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 \
  libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils \
  # Cleanup
  && apt-get clean all \
  && rm -rf /var/lib/apt/lists/*

# Add revelationsai user
RUN groupadd -r revelationsai \
  && useradd -rm -g revelationsai -G audio,video revelationsai

# Install node dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev \
  && npm i -g prisma \
  && npm cache clean --force

# Copy source files
COPY --from=builder --chown=revelationsai:revelationsai /app/.next/standalone ./
COPY --from=builder --chown=revelationsai:revelationsai /app/.next/static ./.next/static
COPY --from=builder --chown=revelationsai:revelationsai /app/md ./md
COPY --from=builder --chown=revelationsai:revelationsai /app/public ./public

# Copy Prisma files
COPY --from=builder --chown=revelationsai:revelationsai /app/prisma ./prisma

# Set permissions
RUN chown -R revelationsai:revelationsai /app \
  && chmod -R 755 /app

USER revelationsai

EXPOSE 8080

CMD [ "node", "server.js" ]
