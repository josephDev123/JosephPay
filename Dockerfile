FROM node:22-bookworm-slim AS base

WORKDIR /app

FROM base AS dev

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5000

CMD ["npm", "run", "start:dev"]

FROM base AS builder

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM base AS production

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 5000

CMD ["node", "dist/src/main.js"]
