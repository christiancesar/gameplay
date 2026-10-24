# Build context: repository root.
#   docker build -f apps/api/Dockerfile -t gameplay-api .

FROM node:24-alpine AS base
WORKDIR /repo

# Keeps only what the api needs from the monorepo (api, packages it uses, pruned lockfile).
FROM base AS pruner
RUN npm install -g turbo@2.11.10
COPY . .
RUN turbo prune api --docker

FROM base AS builder
COPY --from=pruner /repo/out/json/ .
# Scripts are skipped here: the Prisma schema is not copied yet.
RUN npm ci --ignore-scripts
COPY --from=pruner /repo/out/full/ .
RUN npm run db:generate --workspace api \
  && npx turbo run build --filter=api

FROM base AS runner
ENV NODE_ENV=production
COPY --from=pruner /repo/out/json/ .
# --omit=optional: @prisma/client has the Prisma CLI as an optional peer, which
# would bring Prisma Studio, TypeScript and React (~250 MB) into the image.
# Revisit when a dependency needs optional platform packages (sharp, BE-07).
RUN npm ci --omit=dev --omit=optional --ignore-scripts && npm cache clean --force
COPY --from=builder /repo/packages/shared/dist ./packages/shared/dist
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
USER node
EXPOSE 3333
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3333}/api/health || exit 1
CMD ["node", "apps/api/dist/main"]
