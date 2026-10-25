# Build context: repository root.
#   docker build -f apps/web/Dockerfile -t gameplay-web .
# Serves the Vite build with nginx (infra/host/nginx.conf is mounted by the
# compose file, it also proxies /api and /socket.io to the api).

FROM node:24-alpine AS base
WORKDIR /repo

# Keeps only what the web app needs from the monorepo.
FROM base AS pruner
RUN npm install -g turbo@2.11.10
COPY . .
RUN turbo prune web --docker

FROM base AS builder
COPY --from=pruner /repo/out/json/ .
RUN npm ci --ignore-scripts
COPY --from=pruner /repo/out/full/ .
# Vite inlines VITE_* at build time.
ARG VITE_SENTRY_DSN=
ARG VITE_SENTRY_ENVIRONMENT=production
ARG VITE_SENTRY_RELEASE=
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_SENTRY_ENVIRONMENT=$VITE_SENTRY_ENVIRONMENT \
    VITE_SENTRY_RELEASE=$VITE_SENTRY_RELEASE
RUN npx turbo run build --filter=web

FROM nginx:1.31-alpine AS runner
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
