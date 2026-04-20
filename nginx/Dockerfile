# ──────────────────────────────────────────────────────
# UniGPU — Nginx + Frontend Docker image
# Multi-stage build:
#   Stage 1 (builder): Node — builds the React app
#   Stage 2 (runtime): Nginx — serves static files + proxies FastAPI
# ──────────────────────────────────────────────────────

# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy source and build
COPY frontend/ .
RUN npm run build
# Output is in /app/dist


# Stage 2: Nginx runtime
FROM nginx:1.25-alpine

# Copy built React app into Nginx's static files directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx config
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Nginx runs on 80 (HTTP redirect) and 443 (HTTPS)
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
