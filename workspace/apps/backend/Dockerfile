FROM docker.io/node:20.2.0

ENV HOST=0.0.0.0
ENV PORT=8080

WORKDIR /app

RUN apt-get update -y && \
  apt-get install -y build-essential python chromium chromium-driver && \
  apt-get clean all && \
  rm -rf /var/lib/apt/lists/*

RUN groupadd -r sept && useradd --no-log-init -r -g sept sept

COPY package.json ./
COPY dist/apps/backend backend

RUN npm install && \
  npm rebuild @tensorflow/tfjs-node --build-from-source && \
  chown -R sept:sept /app && \
  chmod -R 755 /app

USER sept

EXPOSE 8080

CMD [ "node", "backend/main.js" ]
