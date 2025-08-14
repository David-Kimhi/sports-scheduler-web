# ---- 1) Build with Node ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

# Build-time args for the downloader (safe defaults)
ARG SKIP_ASSET_DOWNLOAD=1
ARG BACKEND_BASE
ARG FOOTBALL_ENDPOINT=/football
ENV BACKEND_BASE=$BACKEND_BASE
ENV FOOTBALL_ENDPOINT=$FOOTBALL_ENDPOINT

# Optional: skip logos on first build
RUN if [ "$SKIP_ASSET_DOWNLOAD" = "1" ]; then \
        echo "Skipping download:assets"; \
    else \
        npm run download:assets; \
    fi

# Type-check/transpile & build Vite
RUN npx tsc -p tsconfig.json --pretty false
RUN npx vite build

# ---- 2) Serve with Caddy ----
FROM caddy:2.8-alpine

# Static site
COPY --from=builder /app/dist /usr/share/caddy

# Caddy config (this file must be in the web repo)
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443
# (Default CMD in caddy image runs the server)
