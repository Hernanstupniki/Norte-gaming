FROM node:20-alpine

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ARG APP_COMMIT_SHA=unknown
ARG OCI_SOURCE
ENV APP_COMMIT_SHA=${APP_COMMIT_SHA}

LABEL org.opencontainers.image.revision=${APP_COMMIT_SHA} \
      org.opencontainers.image.source=${OCI_SOURCE} \
      org.opencontainers.image.version=${APP_COMMIT_SHA}

EXPOSE 3000
CMD ["npm", "run", "start"]
