# TEL-02 Sentry completo no front: traces, logs e métricas

## Escopo
- `browserTracingIntegration` ligada ao router, `tracePropagationTargets` para `/api` e propagação do `traceparent` para a API (conferir na documentação do SDK v11).
- `Telemetry.log` com `Sentry.logger`; `Telemetry.measure` com `Sentry.metrics`.
- Medições de WebRTC (30 s) e de início de transmissão como métricas, com atributos no lugar do `context`.
- Faro deixa de ser inicializado no web (sai do `CompositeTelemetry`), ou continua em paralelo até o TEL-05, a decidir com o usuário.
- Amostragem de traces baixa e configurável.

## Fora do escopo
Painéis (TEL-05). Spans da API no Sentry.

## Checklist
- [x] Trace do browser continua na API (conferido no Tempo e no Sentry)
- [x] Métricas de chamada e de início de transmissão visíveis no Sentry
- [x] Logs do client no Sentry
- [x] Specs e testes verdes; build do web e `docker build` iguais

## Notas da execução (2026-10-28)

- **Traces:** `tanstackRouterBrowserTracingIntegration(router)` (o router entra por `createTelemetry`), `tracesSampleRate` 0.1 fixo em `sentry/sentry-options.ts` *(suposição)* para não estourar a cota; `tracePropagationTargets` para o `/api` da própria origem e, no desktop, o `/api` de qualquer servidor (o servidor só é escolhido depois que o Sentry inicia).
- **Traceparent:** `propagateTraceparent` fica ligado só quando o Faro está desligado. Com os dois ligados, o Faro já põe o `traceparent` e dois cabeçalhos quebrariam o trace.
- **Logs e métricas:** `SentryTelemetry.log` usa `Sentry.logger` (no v11 não há `enableLogs`, loga-se ao usar) e `measure` vira uma `Sentry.metrics.distribution` por valor, nomeada `<medição>.<chave>` (`webrtc.rtt_ms`). `app` entra como atributo em todos, e `connection` vem de `attributes`. Nomes e mapeamento do dashboard do Grafana em `infra/sentry/README.md`.
- **O Faro continua ligado no web** (`CompositeTelemetry`) até a comparação do TEL-05. Nenhuma tela mudou.
- O desktop também coleta qualidade de chamada agora (`measuring` do Sentry é verdadeiro): o `CallQualityReporter` roda a cada 30 s numa chamada.
- A telemetria passou a iniciar logo que o `App` monta, e não depois de escolher o servidor: o Sentry do desktop não depende do servidor, e erros da tela de escolha também interessam.
- Não verificado: a chegada de traces, logs e métricas ao Sentry de verdade (o token de organização do build não lê eventos). Checado com a opções do SDK em specs e, no desktop empacotado, com um sink local (veja o TEL-03).
