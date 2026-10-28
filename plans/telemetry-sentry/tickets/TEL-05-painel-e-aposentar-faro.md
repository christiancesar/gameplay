# TEL-05 Painel no Sentry e aposentar o Faro

## Escopo
- Painel de qualidade de chamada no Sentry (fatia via TURN, RTT, perda, tempo de início de transmissão), equivalente ao `infra/grafana/dashboards/media.json`.
- Aposentar o dashboard do Grafana, a seção do Faro no `infra/grafana/README.md` e, se o usuário confirmar, o `/monitoring/faro` no nginx e `FARO_COLLECTOR_URL`.
- O `FaroTelemetry` fica no código, desligado.

## Checklist
- [ ] Painel no Sentry com os mesmos números do dashboard antigo, conferidos lado a lado por alguns dias
- [ ] Documentação do host atualizada
