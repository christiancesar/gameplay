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
- [ ] Variável de ambiente de deploy no `otel.ts` e no compose
- [ ] README e `.env.example`
- [ ] Traces, logs e métricas do host visíveis no Grafana com `deployment.environment.name=host`
- [ ] Commit

## Critério de aceite
Uma chamada a `/api/health` pelo domínio aparece no Tempo e o log dela no Loki, filtrando por `host`.
