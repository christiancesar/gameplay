# Telemetria no Sentry: plano técnico

## 1. A porta `Telemetry` (client)

Em `packages/client/src/shared/telemetry/`. Tipos nossos, sem import de Sentry ou Faro fora dos provedores.

```ts
interface Telemetry {
  captureError(error: unknown, context?: ErrorContext): void
  log(level: 'info' | 'warn' | 'error', message: string, attributes?: Attributes): void
  measure(measurement: Measurement): void // vira métrica
  setUser(user: { id: string } | null): void
  setView(routeId: string): void // nome da navegação (transaction)
  readonly measuring: boolean
}
```

`Measurement` passa a ser `{ name: string; value: number; unit?: string; attributes?: Record<string, string> }`. Hoje ele é `{ type, values, context }` e mora em `faro.ts`; o mapper `toShareStartMeasurement` e o `voice.controller` são adaptados.

Provedores, um arquivo por classe: `SentryTelemetry`, `FaroTelemetry` (o código atual do `faro.ts`, movido), `NoopTelemetry` e `CompositeTelemetry` (escreve em vários, usado na transição). `createTelemetry(config)` escolhe.

O `monitoring` atual (`createMonitoring`) é a base: ele já separa as ViewModels do SDK. A mudança é ampliar a interface e tirar o Faro do tipo.

## 2. Sentry completo no front

- **Erros:** como hoje, com `scrubEvent` e Replay só em erro.
- **Traces:** `browserTracingIntegration` ligada ao router do TanStack, `tracePropagationTargets` para `/api`. Mandar também o `traceparent` W3C para a API (OTel) continuar o trace no Grafana Tempo; conferir a opção exata na documentação do SDK v11 na hora. Amostragem de traces baixa no início.
- **Logs:** `enableLogs` e `Sentry.logger`, mapeando `Telemetry.log`.
- **Métricas:** `Sentry.metrics` (distribution e gauge), mapeando `Telemetry.measure`. As medições de WebRTC (a cada 30 s) e de início de transmissão viram métricas com atributos.
- **Tunnel:** o `/monitoring/sentry` do nginx já repassa envelopes; logs e métricas viajam no mesmo envelope.

## 3. Configuração em tempo de execução (servidor)

Endpoint público `GET /api/monitoring/config`: `{ provider: 'sentry' | 'faro', dsn?, environment, release, tunnel } | null`, montado das envs que o host já tem (`SENTRY_DSN`, `SENTRY_ENVELOPE_URL`, `FARO_COLLECTOR_URL`). O DSN do Sentry é público por desenho.

- **Web:** continua com `VITE_*` no build (mesma origem), ou lê o endpoint; decidir no TEL-03.
- **Desktop:** `Platform.server` lê o endpoint depois de escolher o servidor e inicia a telemetria com isso. Sem endpoint ou com `null`, `NoopTelemetry`.

## 4. Main process do Electron

`@sentry/electron/main` no `apps/desktop`:
- exceções e rejeições do main, crashes nativos (minidump) e o `render-process-gone`;
- os logs do pino que valem (warn, error e os eventos de áudio e captura) vão como Sentry Logs, em vez de um segundo destino;
- o `main.log` local continua, como cópia quando está offline.

O DSN vem do mesmo endpoint de configuração. Do main não há bloqueador de anúncios, então ele envia direto ao Sentry. Identificação: `userId` só quando houver sessão, senão um id anônimo da instalação. Sem conteúdo de áudio nem de console além de aviso e erro.

## 5. O que muda no resto

- `infra/grafana/dashboards/media.json` e a seção do Faro no `infra/grafana/README.md`: aposentados quando houver o equivalente no Sentry.
- `nginx.conf` do self-hosted e do production: o `/monitoring/faro` fica, sem uso, até remover.
- API e métricas de mídia da API: sem mudança.

## 6. Riscos

- Cota e custo do Sentry com logs, spans e métricas ligados; começar com amostragem baixa.
- Métricas do Sentry ainda são recentes; confirmar nome e forma da API na versão instalada.
- Replay dentro do Electron (`app://`): validar; se der problema, desligar só no desktop.
- Endpoint de configuração público: não pode devolver nada além do que o DSN já expõe.
