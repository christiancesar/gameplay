# BE-16 · OpenTelemetry e Grafana Cloud

> Pontos: 3 · Modelo sugerido: Sonnet · Depende de: BE-02 · Onda 3

## Contexto
O backend exporta traces, métricas e logs para o Grafana Cloud free, com os logs pino em JSON. Os traces do browser (Sentry) se ligam aos do Nest pelo `tracePropagationTargets` apontando para `/api`.

## Escopo
- `src/lib/otel.ts`, carregado antes do Nest (flag `--require` no start ou import no topo do `main.ts`), com auto-instrumentação de HTTP, Express, Prisma e pino.
- Exportação OTLP configurada por env (`OTEL_EXPORTER_OTLP_ENDPOINT`, cabeçalhos de auth), e desligada quando ausente (dev sem Grafana).
- `trace_id` e `span_id` nos logs pino.
- Atributos de serviço: nome, versão e ambiente.

## Fora do escopo
Dashboards e alertas no Grafana, Sentry no web.

## Referências
- `plans/[complete]-core-product/00-requirements.md` 5
- `plans/[complete]-backend/04-tech-plan.md` seção 1

## Checklist
- [x] Consultar docs atuais do OpenTelemetry Node SDK e da instrumentação do Prisma 7
- [x] SDK inicializado antes do Nest
- [x] Exportação desligada sem env, e ligada com env (validar com um coletor local ou com o Grafana)
- [x] Ids de trace nos logs
- [x] Commit

## Critério de aceite
Uma requisição a `/api/health` gera um trace com o span do banco no destino configurado, e o log da requisição carrega o mesmo `trace_id`.

## Notas da execução
- `src/lib/otel.ts` (`startTelemetry`, `shutdownTelemetry`), iniciado por `src/lib/otel-start.ts`, a primeira linha do `main.ts`. O `TelemetryModule` descarrega o que ficou no buffer no desligamento. Testes e e2e não passam pelo `main.ts`, então nunca ligam a telemetria.
- Liga só com `OTEL_EXPORTER_OTLP_ENDPOINT`. Os exporters (OTLP/protobuf) leem endpoint, headers e protocolo do ambiente. O `.env` é carregado com `dotenv` antes do SDK, sem sobrescrever variáveis já definidas no container.
- Instrumentação: HTTP, Express, Nest, pg, Prisma (`@prisma/instrumentation`, sem preview feature no Prisma 7) e pino. O pino ganha `trace_id` e `span_id` em cada linha e as linhas também vão como logs OTLP.
- Recurso: `service.name` (`OTEL_SERVICE_NAME`, padrão `gameplay-api`), `service.version` do `package.json` e `deployment.environment.name` do `NODE_ENV`.
- **Versões:** a última leva do OpenTelemetry (api 1.10, sdk 0.300, pacotes 3.0) saiu em 2026-10-20 com major nova. Fiquei na de 2026-08-31 (api `~1.9.1`, sdk-node e exporters 0.222, sdk-metrics e resources 2.11, instrumentações da mesma data).
- **Validação com coletor local** (servidor OTLP/HTTP no scratchpad, nada enviado ao Grafana): `GET /api/health` gerou o trace com `prisma:client:operation`, `prisma:client:db_query` e `pg.query`; `GET /api/settings/public` gerou o log `request completed` com o mesmo `trace_id` do trace, que também tem o `db_query`. Métricas e logs chegaram no coletor.
- **Observações:**
  - O log automático do `/api/health` continua desligado (o healthcheck do container chama a cada 10 s), então o critério do log com `trace_id` foi conferido em outra rota. O trace do health continua sendo gerado, a cada 10 s; se pesar no free tier do Grafana, dá para ignorar o health na instrumentação HTTP.
- **Validação no Grafana Cloud (2026-10-25):**
  - Host (`npm run build && npm start` com `OTEL_LOG_LEVEL=debug`): traces, métricas e logs exportados sem nenhuma falha. Os endpoints OTLP do gateway respondem 200 (traces, métricas) e 204 (logs) com a credencial do `.env`, e 401 com uma credencial falsa, então a autenticação vale.
  - Container (`npm run docker:api`): o `.dockerignore` deixa o `.env` de fora e o compose não repassava os `OTEL_*`, então o container subia sem telemetria. Corrigido com `env_file` opcional apontando para `apps/api/.env` no serviço `api`; o `environment` do compose continua valendo para o resto. Conferido: as linhas do pino saem com `trace_id` e o container alcança o gateway (200).
  - Falta só abrir o Explore do Grafana (Tempo, `service.name = gameplay-api`) para ver os traces na interface; não há token de API do Grafana aqui para consultar de fora.
