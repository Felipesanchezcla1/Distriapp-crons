# ====== Dependencias ======
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ====== Runtime ======
FROM node:22-alpine
ENV NODE_ENV=production \
    TZ=America/Bogota
WORKDIR /app

RUN apk upgrade --no-cache && apk add --no-cache tini tzdata

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN mkdir -p /app/logs && chown node:node /app/logs

USER node

# El scheduler escribe /tmp/heartbeat en cada tick (cada 5 min).
# Si pasan más de 12 min sin latido, queda unhealthy.
HEALTHCHECK --interval=60s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "try{const t=require('fs').statSync('/tmp/heartbeat').mtimeMs;process.exit(Date.now()-t<720000?0:1)}catch{process.exit(1)}"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]