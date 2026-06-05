FROM node:20-alpine

WORKDIR /app

# Copiar dependencias primero (cache layer)
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el código
COPY . .

EXPOSE 3001

CMD ["node", "server.js"]