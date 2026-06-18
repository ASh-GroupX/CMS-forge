# syntax=docker/dockerfile:1
# F0-03 runtime plumbing: build and run the API scaffold. No domain behavior.

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
# Workspace manifests + lockfile first for cacheable installs.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/database/package.json ./packages/database/package.json
RUN pnpm install --frozen-lockfile
COPY apps/api ./apps/api
RUN pnpm exec tsc -p apps/api/tsconfig.json

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
