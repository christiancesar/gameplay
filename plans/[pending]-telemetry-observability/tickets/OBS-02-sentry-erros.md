# OBS-02 · Sentry para erros do web

> Pontos: 3 · Modelo sugerido: Sonnet · Depende de: FE-13 · Onda 1

## Contexto
O Sentry está ligado no código desde o FE-13, mas desligado sem DSN. Decisão do usuário em 2026-10-26: o Sentry cuida só de **erros** do front; desempenho, sessões e traces do browser ficam com o Faro (OBS-04), que fala com o mesmo Grafana da API.

## Escopo
- Projeto no Sentry (org `christian-cesar`), DSN em `VITE_SENTRY_DSN`.
- Sentry só para erros: tirar o tracing (`tanstackRouterBrowserTracingIntegration`, `tracesSampleRate`, `tracePropagationTargets`). Replay continua só em erro, mascarando texto e mídia.
- `environment` (`host`, `development`) e `release` (sha do git) no build.
- Source maps com `@sentry/vite-plugin`, `SENTRY_AUTH_TOKEN` passado como secret do build Docker (nunca como `ARG` gravado na imagem). Os `.map` não ficam no nginx.
- Build args no `infra/self-hosted/docker-compose.yml` e no `apps/web/Dockerfile`; README do host.

## Fora do escopo
Faro (OBS-04). CI (não existe ainda).

## Checklist
- [x] Tracing do Sentry removido, testes do `sentry.ts` ajustados
- [x] Source maps enviados no build e removidos do bundle servido
- [ ] Erro de teste no host aparece no Sentry com stack trace legível
- [x] Commit

## Critério de aceite
Um erro forçado no web do host chega ao Sentry com o arquivo e a linha do código fonte, sem cookies nem dados pessoais.

## Notas da execução (2026-10-26)

- `sentry.ts` só com erros: saíram `tanstackRouterBrowserTracingIntegration`, `tracesSampleRate` e `tracePropagationTargets`. `initSentry()` não recebe mais o router. Replay continua só em erro, mascarando texto e mídia; `scrubEvent` igual.
- `@sentry/vite-plugin` 11.9 por último no `vite.config.ts`, ligado só quando há `SENTRY_AUTH_TOKEN`: gera source maps `hidden`, envia ao Sentry e apaga os `.map` do `dist`. Sem token, o build fica como antes (sem source maps).
- `turbo.json`: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` e `SENTRY_PROJECT` em `passThroughEnv` do `build` (o modo estrito do Turbo filtraria as variáveis; passThrough não entra no hash do cache).
- Dockerfile do web: o token entra como build secret (`--mount=type=secret,id=sentry_auth_token`), nunca como `ARG`. Compose: secret `sentry_auth_token` vindo da variável de ambiente, `SENTRY_ORG`, `SENTRY_PROJECT`, ambiente do Sentry igual ao `OTEL_DEPLOYMENT_ENVIRONMENT` (`host`) e release = commit curto (`GAMEPLAY_RELEASE`, exportado pelo `start.sh`).
- Conferido no host: "Successfully uploaded source maps to Sentry" no build, nenhum `.map` no nginx, DSN no bundle e o token ausente do `docker history` da imagem.
- Teste do usuário no Brave: o SDK capturou o erro, mas o envio para `*.ingest.sentry.io` foi bloqueado pelo Shields (`net::ERR_BLOCKED_BY_CLIENT`). Bloqueadores fazem o mesmo.
- Tunnel: o SDK envia para `/monitoring/sentry` (`VITE_SENTRY_TUNNEL`) e o nginx repassa só para o envelope do nosso projeto. A URL de destino vem do DSN (`start.sh` exporta `GAMEPLAY_SENTRY_ENVELOPE_URL`). O `nginx.conf` virou template da imagem do nginx, com `NGINX_ENVSUBST_FILTER=^GAMEPLAY_` para não tocar nas variáveis do próprio nginx. Sem DSN, o caminho responde 404; só aceita POST; cookies e IP do cliente não são repassados. Conferido: um envelope de teste ("tunnel test (Claude, OBS-02)") foi aceito pelo Sentry pelo domínio.
- Falta o usuário conferir um erro real do navegador chegando ao Sentry com o código original.
- O IP do usuário não chega ao Sentry pelo tunnel (o Sentry vê o IP do servidor). *(suposição: é o desejado)*

Suposições:
- Release do Sentry = commit curto do git no momento do `host:start`. Mudanças não commitadas entram com o mesmo release do último commit. *(suposição)*
- `SENTRY_PROJECT_ID`, que está no `.env` do host, não é usado. *(suposição)*
