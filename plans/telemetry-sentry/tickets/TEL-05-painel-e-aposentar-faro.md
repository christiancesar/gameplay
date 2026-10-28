# TEL-05 Painel no Sentry e aposentar o Faro

## Escopo
- Painel de qualidade de chamada no Sentry (fatia via TURN, RTT, perda, tempo de início de transmissão), equivalente ao `infra/grafana/dashboards/media.json`.
- Aposentar o dashboard do Grafana, a seção do Faro no `infra/grafana/README.md` e, se o usuário confirmar, o `/monitoring/faro` no nginx e `FARO_COLLECTOR_URL`.
- O `FaroTelemetry` fica no código, desligado.

## Checklist
- [ ] Painel no Sentry com os mesmos números do dashboard antigo, conferidos lado a lado por alguns dias
- [ ] Documentação do host atualizada

## Notas da execução (2026-10-28)

- **Feito:** `infra/sentry/README.md` com os projetos, o que chega de cada app, o mapa das métricas do Grafana para o Sentry (`webrtc.rtt_ms`...) e a receita do painel; a nota no `infra/grafana/README.md`.
- **Faro desligado por configuração** (2026-10-28, pedido do usuário): `FARO_COLLECTOR_URL` vazio em `.env.web` e em `infra/production/.env`. Nada removido: o provedor, o tunnel do nginx e o dashboard do Grafana continuam. O dashboard `media.json` fica sem dados novos.
- **Não feito:** o painel no Sentry (fica na interface; o token de organização do build não cria dashboards).
- Custo anotado: o código do Faro continua no bundle, uns 210 kB (67 kB comprimido). Tirar do bundle é opcional e está descrito em `infra/sentry/README.md`.
- Status: **parcial**, falta o painel no Sentry.
