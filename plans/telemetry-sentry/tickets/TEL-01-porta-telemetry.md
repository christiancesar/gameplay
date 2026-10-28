# TEL-01 Porta `Telemetry` e provedores

## Escopo
- `shared/telemetry/` com a interface `Telemetry`, `Measurement` e `ErrorContext` próprios.
- `SentryTelemetry` (o `sentry.ts` atual por dentro), `FaroTelemetry` (o `faro.ts` atual movido), `NoopTelemetry`, `CompositeTelemetry` e `createTelemetry(config)`.
- Trocar os usos de `monitoring` e do tipo `Measurement` (`voice.controller`, `share.controller`, `share-start.mapper`, `use-monitoring-user`, `use-sign-out`, `app.tsx`) para a porta.
- Fakes e specs por provedor; nenhuma ViewModel importa Sentry ou Faro.

## Fora do escopo
Traces, logs e métricas no Sentry (TEL-02). Configuração do servidor (TEL-03).

## Checklist
- [ ] Porta e provedores com specs (um arquivo por classe, fake em arquivo próprio)
- [ ] Usos migrados, nenhum import de `@sentry/*` ou `@grafana/*` fora dos provedores (regra de lint)
- [ ] Comportamento igual ao de hoje no web (Sentry erros, Faro ainda ligado via `CompositeTelemetry`)
- [ ] `npm run typecheck`, `lint`, `format:check` e `npm test`
