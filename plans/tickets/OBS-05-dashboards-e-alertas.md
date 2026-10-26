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
- [ ] Três dashboards
- [ ] Alertas
- [ ] README
- [ ] Commit

## Critério de aceite
Os três dashboards mostram dados do host depois de uma call real, e derrubar a API dispara o alerta.
