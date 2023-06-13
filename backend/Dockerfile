FROM docker.io/node:20.2.0

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

# Add sept user
RUN groupadd -r sept \
  && useradd -rm -g sept -G audio,video sept

# Copy essential files
COPY package*.json ./
COPY dist ./dist

# Install node dependencies
RUN npm ci --omit=dev \
  && npm cache clean --force \
  && chown -R sept:sept /app \
  && chmod -R 755 /app

USER sept

EXPOSE 8080

CMD [ "node", "dist/main" ]
