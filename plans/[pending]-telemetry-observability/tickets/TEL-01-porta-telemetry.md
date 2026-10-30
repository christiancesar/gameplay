# TEL-01 Porta `Telemetry` e provedores

## Escopo
- `shared/telemetry/` com a interface `Telemetry`, `Measurement` e `ErrorContext` próprios.
- `SentryTelemetry` (o `sentry.ts` atual por dentro), `FaroTelemetry` (o `faro.ts` atual movido), `NoopTelemetry`, `CompositeTelemetry` e `createTelemetry(config)`.
- Trocar os usos de `monitoring` e do tipo `Measurement` (`voice.controller`, `share.controller`, `share-start.mapper`, `use-monitoring-user`, `use-sign-out`, `app.tsx`) para a porta.
- `app: 'web' | 'desktop'` na configuração do `Platform` e gravado como tag por todos os provedores (o `environment` fica só com `development`, `production` ou `host`).
- Fakes e specs por provedor; nenhuma ViewModel importa Sentry ou Faro.

## Fora do escopo
Traces, logs e métricas no Sentry (TEL-02). Configuração do servidor (TEL-03).

## Checklist
- [x] Porta e provedores com specs (um arquivo por classe, fake em arquivo próprio)
- [x] Usos migrados, nenhum import de `@sentry/*` ou `@grafana/*` fora dos provedores (regra de lint)
- [x] Comportamento igual ao de hoje no web (Sentry erros, Faro ainda ligado via `CompositeTelemetry`)
- [x] `npm run typecheck`, `lint`, `format:check` e `npm test`

## Notas da execução (2026-10-28)

Feito na `feature/desktop-app`, a pedido do usuário (tudo na mesma branch).

- **Onde fica:** `packages/client/src/shared/lib/telemetry/` (a pasta `shared/lib` já tem permissão nas camadas do lint). `telemetry.ts` (interface e tipos), `noop`, `composite`, `current-telemetry.ts` (o `telemetry` que controllers e ViewModels importam, repassando ao que o app instalou), `create-telemetry.ts`, e os provedores em `sentry/` e `faro/` (cada um com `create-*-telemetry.ts`, que inicia o SDK).
- **A configuração vem do `Platform`:** novo campo `telemetry: TelemetryConfig` (`app`, `environment`, `release`, `sentry`, `faro`). O web monta a sua a partir das `VITE_*` do build (`telemetryFromBuild` em `apps/web/src/browser-platform.ts`); o client não lê mais `import.meta.env`. O desktop devolve `sentry: null, faro: null` por enquanto (TEL-03 liga).
- **Tag `app`:** vai em `initialScope.tags` do Sentry e no nome do app do Faro (`gameplay-web` para o web, o mesmo `service_name` que o dashboard de qualidade de chamada usa; `gameplay-desktop` no desktop).
- **`Measurement` ficou `{ name, values, attributes }`**, e não `{ name, value }` como o plano dizia. *(suposição)* mantive o mapa `values` porque cada amostra de WebRTC traz vários números juntos e o Faro as grava assim; no TEL-02 cada chave vira uma métrica do Sentry (`webrtc.rtt_ms`...).
- **`SentryTelemetry` hoje só leva erros e o usuário.** `log`, `measure` e `setView` não fazem nada até o TEL-02. `measuring` do Sentry é `false`; o do Faro é `true`.
- **Início da telemetria:** `App` chama `startTelemetry(platform)` (no lugar de `startMonitoring`), e o nome da tela passa a ser dado por `telemetry.setView` a cada rota resolvida, para qualquer provedor.
- **`ErrorBoundary` do `@sentry/react` trocado** por `app/telemetry-error-boundary.tsx`, que mostra o fallback e reporta pela porta. Era o único import do SDK fora dos provedores.
- **Lint:** `no-restricted-imports` proíbe `@sentry/*` e `@grafana/*` em todo `src/`, menos em `shared/lib/telemetry/sentry/**` e `faro/**`.
- Removidos: `shared/lib/monitoring.ts`, `faro.ts`, `sentry.ts` e os specs deles (movidos para os provedores).
- **Conferido:** client 1012 testes unitários e 277 de stories, web 7, desktop 36; typecheck, lint e formato do monorepo; `vite build` do web com as `VITE_*` embute `/monitoring/sentry`. Cypress não foi rodado.
