# sports-scheduler-web/Dockerfile

# 1) Build Vite app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vite build (runs download:assets + tsc via package.json "build")
RUN npm run build

# 2) Serve with Caddy
FROM caddy:2.8-alpine
# Static files go to Caddy's web root:
COPY --from=builder /app/dist /usr/share/caddy
# Caddy config (added next):
COPY Caddyfile /etc/caddy/Caddyfile
