FROM node:20.2.0-alpine3.18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install && npm run build
CMD [ "node", "dist/main.js" ]
EXPOSE 3000
