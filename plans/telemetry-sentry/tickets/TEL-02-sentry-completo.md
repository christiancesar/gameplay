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
- [ ] Trace do browser continua na API (conferido no Tempo e no Sentry)
- [ ] Métricas de chamada e de início de transmissão visíveis no Sentry
- [ ] Logs do client no Sentry
- [ ] Specs e testes verdes; build do web e `docker build` iguais
