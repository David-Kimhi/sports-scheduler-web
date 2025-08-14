

# 1) Build Vite app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Allow skipping download step
ARG SKIP_ASSET_DOWNLOAD=0

ARG BACKEND_BASE
ARG FOOTBALL_ENDPOINT=/football
ENV BACKEND_BASE=$BACKEND_BASE
ENV FOOTBALL_ENDPOINT=$FOOTBALL_ENDPOINT

# run build in the same order as your package.json, but allow skipping the download step
RUN if [ "$SKIP_ASSET_DOWNLOAD" = "1" ]; then \
      echo "Skipping download:assets for bootstrap"; \
    else \
      npm run download:assets; \
    fi \
 && tsc -b \
 && vite build


# 2) Serve with Caddy
FROM caddy:2.8-alpine
# Static files go to Caddy's web root:
COPY --from=builder /app/dist /usr/share/caddy
# Caddy config (added next):
COPY Caddyfile /etc/caddy/Caddyfile
