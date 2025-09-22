# ====== Dependencias (instalación) ======
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ====== Runtime ======
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

# Copia node_modules y el código
COPY --from=deps /app/node_modules /app/node_modules
COPY . .

# Carpeta de logs dentro del proyecto (se montará un volumen en /app/logs)
RUN mkdir -p /app/logs

# Puerto del healthcheck (ajústalo si usas otro)
EXPOSE 3000

# Healthcheck simple contra /health
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Ejecuta el scheduler
CMD ["node", "src/index.js"]