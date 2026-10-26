# OBS-02 · Sentry para erros do web

> Pontos: 3 · Modelo sugerido: Sonnet · Depende de: FE-13 · Onda 1

## Contexto
O Sentry está ligado no código desde o FE-13, mas desligado sem DSN. Decisão do usuário em 2026-10-26: o Sentry cuida só de **erros** do front; desempenho, sessões e traces do browser ficam com o Faro (OBS-04), que fala com o mesmo Grafana da API.

## Escopo
- Projeto no Sentry (org `christian-cesar`), DSN em `VITE_SENTRY_DSN`.
- Sentry só para erros: tirar o tracing (`tanstackRouterBrowserTracingIntegration`, `tracesSampleRate`, `tracePropagationTargets`). Replay continua só em erro, mascarando texto e mídia.
- `environment` (`host`, `development`) e `release` (sha do git) no build.
- Source maps com `@sentry/vite-plugin`, `SENTRY_AUTH_TOKEN` passado como secret do build Docker (nunca como `ARG` gravado na imagem). Os `.map` não ficam no nginx.
- Build args no `infra/host/docker-compose.yml` e no `apps/web/Dockerfile`; README do host.

## Fora do escopo
Faro (OBS-04). CI (não existe ainda).

## Checklist
- [ ] Tracing do Sentry removido, testes do `sentry.ts` ajustados
- [ ] Source maps enviados no build e removidos do bundle servido
- [ ] Erro de teste no host aparece no Sentry com stack trace legível
- [ ] Commit

## Critério de aceite
Um erro forçado no web do host chega ao Sentry com o arquivo e a linha do código fonte, sem cookies nem dados pessoais.
