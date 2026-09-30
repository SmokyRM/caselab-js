FROM node:20-bookworm-slim AS base

WORKDIR /app

COPY package.json package-lock.json ./

FROM base AS deps

RUN npm ci

FROM deps AS migration

COPY --chown=node:node . .

USER node

CMD ["npm", "run", "db:migrate"]

FROM base AS runtime

ENV NODE_ENV=production

RUN npm ci --omit=dev \
  && npm cache clean --force \
  && chown -R node:node /app

COPY --chown=node:node src ./src

USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
