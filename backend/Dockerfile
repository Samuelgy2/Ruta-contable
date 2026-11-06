FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Dependencias primero (cache de capas); npm ci respeta package-lock.json
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Código, con dueño no-root
COPY --chown=node:node . .
RUN mkdir -p logs && chown node:node logs

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
