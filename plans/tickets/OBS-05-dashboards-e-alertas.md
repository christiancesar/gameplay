# OBS-05 · Dashboards e alertas no Grafana

> Pontos: 3 · Modelo sugerido: Sonnet · Depende de: OBS-03, OBS-04 · Onda 3

## Contexto
Com os dados chegando, falta um lugar para consultar qualidade, desempenho e erros sem montar query na mão.

## Escopo
- Dashboards versionados em `infra/grafana/` (JSON), importados manualmente no Grafana Cloud:
  - **Realtime**: conexões, desconexões por motivo, salas, transmissões, espectadores, duração e erros dos handlers;
  - **Qualidade de mídia**: perda, jitter, RTT, fps e bitrate por tipo, e a fatia de calls por relay (TURN);
  - **API**: taxa, latência e erros HTTP, queries lentas.
- Alertas simples: pico de desconexões, erros de handler, API fora do ar (`/api/health`).
- README em `infra/grafana/` com o passo a passo de importação.

## Fora do escopo
Provisionamento automático (Terraform), alertas por canal pago.

## Checklist
- [x] Três dashboards
- [ ] Alertas
- [x] README
- [x] Commit

## Critério de aceite
Os três dashboards mostram dados do host depois de uma call real, e derrubar a API dispara o alerta.

## Notas da execução (2026-10-26)

- Dashboards gerados em `infra/grafana/dashboards/` e importados por API na pasta Gameplay do stack `technologies` (token de service account `GRAFANA_SA_TOKEN` no `.env` da raiz): Gameplay · API, Gameplay · Realtime e Gameplay · Call quality. Variáveis de fonte (Prometheus, Loki) e de ambiente; todas as queries validadas contra o Prometheus e o Loki reais.
- Call quality lê as medidas do Faro no Loki (`kind=measurement`, `type=webrtc` com `value_*` e `context_connection`; `type=web-vitals`). Conferido com uma medida sintética no ambiente `test`, fora dos painéis do `host`.
- Alertas em `infra/grafana/alerts.json`, grupo `gameplay-host` (1 min): API sem telemetria por 5 min, 5xx acima de 5%, event loop p99 acima de 200 ms, mais de 10 quedas de socket em 5 min. Criar regra por regra é recusado numa pasta nova; o `PUT` do grupo inteiro funciona.
- Pendente com o usuário: canal de notificação (não há contact point no stack) e inicializar o Synthetic Monitoring pela interface, para a checagem externa de `/api/health/details` (pega túnel caído, TURN e storage).

Suposições:
- Limites dos alertas (5%, 200 ms, 10 quedas) são chutes iniciais para um grupo pequeno; ajustar com o uso. *(suposição)*
