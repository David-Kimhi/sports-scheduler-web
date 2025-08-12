

# 1) Build Vite app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# NEW: allow skipping download step
ARG SKIP_ASSET_DOWNLOAD=1
ENV SKIP_ASSET_DOWNLOAD=$SKIP_ASSET_DOWNLOAD

# Only download if not skipped
RUN if [ "$SKIP_ASSET_DOWNLOAD" = "1" ]; then \
        echo "Skipping download:assets"; \
    else \
        npm run download:assets; \
    fi

RUN tsc -b && vite build

# 2) Serve with Caddy
FROM caddy:2.8-alpine
# Static files go to Caddy's web root:
COPY --from=builder /app/dist /usr/share/caddy
# Caddy config (added next):
COPY Caddyfile /etc/caddy/Caddyfile
