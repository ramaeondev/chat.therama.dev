# syntax=docker/dockerfile:1.7

# =========================
# 1) Build Angular app
# =========================
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (leverage cache)
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# Build Angular app for production
RUN npm run build:prod

# =========================
# 2) Nginx for static hosting
# =========================
FROM nginx:1.27-alpine AS runtime

# Remove default nginx website and copy our build
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/chat-therama-dev/browser /usr/share/nginx/html

# Add SPA-friendly nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose both HTTP and HTTPS
EXPOSE 80 443

# Install curl for healthcheck
RUN apk add --no-cache curl

# Healthcheck (basic)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
