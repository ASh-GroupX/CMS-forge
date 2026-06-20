# syntax=docker/dockerfile:1
# Build and run the API service.

FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
RUN corepack enable
# Workspace manifests + lockfile first for cacheable installs.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/database/package.json ./packages/database/package.json
RUN pnpm install --frozen-lockfile
COPY packages/database/prisma ./packages/database/prisma
COPY apps/api ./apps/api
RUN pnpm --filter @cms-auto/database exec prisma generate --schema prisma/schema.prisma
RUN pnpm exec tsc -p apps/api/tsconfig.json

FROM node:20-alpine AS runtime
WORKDIR /app/apps/api
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/packages/database/prisma /app/packages/database/prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
