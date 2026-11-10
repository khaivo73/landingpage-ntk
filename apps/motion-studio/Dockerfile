FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg chromium fonts-noto-core ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
RUN mkdir -p /app/data && chown -R node:node /app/data
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 CHROMIUM_PATH=/usr/bin/chromium DATA_DIR=/app/data
USER node
EXPOSE 3000
CMD ["node","server.mjs"]
