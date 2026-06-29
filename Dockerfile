# Single-image deploy: builds the client and runs the server, which serves the
# static client AND the WebSocket on one port. Works on Fly.io, Railway, a VPS,
# Cloud Run, etc. The platform's PORT env is honored (default 8787).
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV PORT=8787
EXPOSE 8787
CMD ["npm", "run", "server"]
