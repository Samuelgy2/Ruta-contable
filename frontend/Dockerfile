# ── Etapa 1: build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias primero (cache layer)
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Build de producción
RUN npm run build

# ── Etapa 2: servidor nginx ───────────────────────────────────
FROM nginx:alpine

# Copiar el build al servidor nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Config nginx para React Router (rutas SPA)
RUN echo 'server { \
  listen 80; \
  location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
  } \
  location /api { \
    proxy_pass http://backend:3001; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "upgrade"; \
    proxy_set_header Host $host; \
    proxy_cache_bypass $http_upgrade; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80