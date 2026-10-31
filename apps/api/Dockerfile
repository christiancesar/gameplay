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
# API docs as JSON, next to dist/docs: the generators are dev dependencies the
# runner doesn't have. The app is created but never started, so placeholder
# env values are enough.
RUN cd apps/api && NODE_ENV=production \
  DATABASE_URL=postgresql://docs@localhost/docs \
  BETTER_AUTH_URL=http://localhost \
  BETTER_AUTH_SECRET=docs-export-placeholder-secret-000000 \
  REGISTRATION_KEY_SECRET=docs-export-placeholder-secret-000000 \
  DOCS_ENABLED=true \
  node dist/scripts/export-docs

FROM base AS runner
ENV NODE_ENV=production
COPY --from=pruner /repo/out/json/ .
# --omit=optional: @prisma/client has the Prisma CLI as an optional peer, which
# would bring Prisma Studio, TypeScript and React (~250 MB) into the image.
# That also drops sharp's prebuilt binaries (optional packages per platform),
# so they're installed apart, for this image's platform (musl, x64 or arm64),
# at the version in the lockfile.
RUN npm ci --omit=dev --omit=optional --ignore-scripts \
  && SHARP_VERSION=$(node -p "require('./node_modules/sharp/package.json').version") \
  && npm install --prefix /tmp/sharp --no-save --no-package-lock --ignore-scripts "sharp@$SHARP_VERSION" \
  && cp -r /tmp/sharp/node_modules/@img/. node_modules/@img/ \
  && rm -rf /tmp/sharp \
  && npm cache clean --force
COPY --from=builder /repo/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder /repo/packages/env/dist ./packages/env/dist
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
# The public-content seed reads the canonical catalog from the planning tree.
COPY plans/features/features.json ./plans/features/features.json
# Mount point for uploads when a named volume is used (STORAGE_LOCAL_DIR=/data/uploads):
# a new volume copies this owner, so the node user can write to it.
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
EXPOSE 3333
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3333}/api/health || exit 1
CMD ["node", "apps/api/dist/main"]
