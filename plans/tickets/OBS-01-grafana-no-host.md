# OBS-01 · Grafana Cloud no host

> Pontos: 2 · Modelo sugerido: Haiku · Depende de: BE-16 · Onda 1

## Contexto
O OpenTelemetry da API (BE-16) só manda dados quando `OTEL_EXPORTER_OTLP_ENDPOINT` está preenchido. No `infra/host/.env` ele está vazio, então o servidor que os amigos usam não aparece no Grafana. O compose já repassa as variáveis `OTEL_*` para a API.

## Escopo
- Preencher `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS` e `OTEL_SERVICE_NAME` no `infra/host/.env` (fora do git).
- Separar dev e host no Grafana pelo `deployment.environment.name`: hoje vem do `NODE_ENV`, que é `production` nos dois casos em que o container roda. Adicionar `OTEL_DEPLOYMENT_ENVIRONMENT` opcional (padrão `NODE_ENV`) e usar `host` no compose do host.
- Documentar no `infra/host/README.md` e no `.env.example`.

## Fora do escopo
Métricas novas (OBS-03), dashboards (OBS-05), frontend (OBS-02 e OBS-04).

## Checklist
- [x] Variável de ambiente de deploy no `otel.ts` e no compose
- [x] README e `.env.example`
- [x] Traces, logs e métricas do host visíveis no Grafana com `deployment.environment.name=host`
- [x] Commit

## Critério de aceite
Uma chamada a `/api/health` pelo domínio aparece no Tempo e o log dela no Loki, filtrando por `host`.

## Notas da execução (2026-10-26)

- `OTEL_EXPORTER_OTLP_ENDPOINT`, `_HEADERS` e `_PROTOCOL` copiados do `apps/api/.env` para o `infra/host/.env` (os dois fora do git). Mesmo stack do Grafana Cloud para dev e host.
- `otel.ts`: `deployment.environment.name` vem de `OTEL_DEPLOYMENT_ENVIRONMENT`, com `NODE_ENV` como reserva. O compose do host usa `host` por padrão.
- README do host com a seção "Observabilidade" e `.env.example` do host e da API documentados.
- Conferido: a API do host sobe com o endpoint, o `deployment.environment.name` é `host` e um POST no endpoint OTLP de dentro do container responde 200 (autenticação ok).
- Conferido pela API de consulta do Grafana Cloud (token de leitura e URLs de Loki, Tempo e Prometheus no `.env` da raiz, fora do git): logs do Nest no Loki, traces `GET /api/health` no Tempo e métricas `http_server_*`, `http_client_*` e `db_client_*` no Prometheus, todos com `deployment_environment_name="host"`.
- Não há métricas de runtime do Node (event loop, memória, GC). Sugestão para o OBS-03: `@opentelemetry/instrumentation-runtime-node`. *(suposição)*
- O token de escrita do Grafana apareceu no histórico da sessão por um erro meu num comando de checagem. Recomendado gerar outro e revogar o atual.
- `OTEL_SERVICE_NAME` continua `gameplay-api` nos dois ambientes; a separação é só pelo ambiente. *(suposição)*
