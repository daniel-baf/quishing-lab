FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node:node server.js ./
COPY --chown=node:node public ./public

ENV NODE_ENV=production
EXPOSE 3000
USER node

CMD ["node", "server.js"]
