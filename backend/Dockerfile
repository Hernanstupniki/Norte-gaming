FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder /app/dist ./dist

ARG APP_COMMIT_SHA=unknown
ARG OCI_SOURCE
ENV APP_COMMIT_SHA=${APP_COMMIT_SHA}

LABEL org.opencontainers.image.revision=${APP_COMMIT_SHA} \
      org.opencontainers.image.source=${OCI_SOURCE} \
      org.opencontainers.image.version=${APP_COMMIT_SHA}

EXPOSE 4000
CMD ["node", "dist/src/main.js"]
