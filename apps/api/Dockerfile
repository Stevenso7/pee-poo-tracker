# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json

RUN npm install

# Copy sources and build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @pee-poo/shared
RUN npm run build -w @pee-poo/api
RUN npm prune --omit=dev

# ---- Production stage ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api ./apps/api

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
