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
- **Não feito, de propósito:** o painel em si (fica na interface do Sentry; o token de organização do build não cria dashboards) e a retirada do Faro. O plano pede comparar os números lado a lado por alguns dias antes. O passo a passo para desligar está no mesmo README.
- Status: **parcial**, aguardando o usuário montar o painel e a comparação.
