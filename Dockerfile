

# 1) Build Vite app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ENV PATH=/app/node_modules/.bin:$PATH
ARG SKIP_ASSET_DOWNLOAD=0
ARG BACKEND_BASE
ARG FOOTBALL_ENDPOINT=/football
ENV BACKEND_BASE=$BACKEND_BASE
ENV FOOTBALL_ENDPOINT=$FOOTBALL_ENDPOINT

# optional: show tool versions
RUN node -v && npm -v && npx tsc -v

# 1) (maybe) download assets
RUN if [ "$SKIP_ASSET_DOWNLOAD" = "1" ]; then \
      echo "Skipping download:assets for bootstrap"; \
    else \
      npm run download:assets; \
    fi

# 2) Type-check / compile TS
RUN npx tsc -b --pretty false

# 3) Build the app
RUN npx vite build --debug