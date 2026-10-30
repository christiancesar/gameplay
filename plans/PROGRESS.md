# Progresso do planejamento

Este arquivo é o índice geral dos planos. O detalhamento, os checklists e as notas de execução ficam dentro do diretório de cada plano.

## Índice dos planos

| Plano | Status | Entrada |
|---|---|---|
| Produto principal | `[complete]` | [[complete]-core-product](./[complete]-core-product/) |
| Backend | `[complete]` | [[complete]-backend](./[complete]-backend/) |
| Transporte de mídia | `[complete]` | [[complete]-media-transport](./[complete]-media-transport/) |
| Portal público | `[pending]` | [[pending]-public-product-portal](./[pending]-public-product-portal/) |
| Frontend web | `[complete]` | [[complete]-web-frontend](./[complete]-web-frontend/) |
| Desktop Electron | `[pending]` | [[pending]-desktop-electron](./[pending]-desktop-electron/) |
| Release Windows | `[pending]` | [[pending]-desktop-windows-release](./[pending]-desktop-windows-release/) |
| Diagnósticos desktop | `[complete]` | [[complete]-desktop-diagnostics](./[complete]-desktop-diagnostics/) |
| Perfis de compartilhamento | `[complete]` | [[complete]-screen-share-profiles](./[complete]-screen-share-profiles/) |
| API realtime | `[pending]` | [[pending]-api-realtime-boundaries](./[pending]-api-realtime-boundaries/) |
| Telemetria e observabilidade | `[pending]` | [[pending]-telemetry-observability](./[pending]-telemetry-observability/) |
| Infraestrutura de produção | `[complete]` | [[complete]-production-infrastructure](./[complete]-production-infrastructure/) |
| Pipeline self-hosted | `[pending]` | [[pending]-self-hosted-pipeline](./[pending]-self-hosted-pipeline/) |
| Backlog de features | `[pending]` | [[pending]-features](./[pending]-features/) |

## Retomar daqui

1. Revisar os checklists manuais pendentes nos planos desktop, Windows, compartilhamento e observabilidade.
2. Continuar o próximo ticket de frontend pendente conforme `AGENTS.md` e o README do plano frontend.
3. Fechar o painel Sentry e os alertas operacionais no plano de telemetria.
4. Validar a próxima release Linux e seguir com os tickets Windows de atualização automática.

## Critério dos marcadores

- `[complete]`: o plano e seus tickets não têm trabalho obrigatório pendente.
- `[pending]`: existe ticket futuro, checklist aberto, validação manual pendente ou decisão adiada.

O marcador do diretório é um resumo visual. O status exato continua no `README.md` e no checklist de cada ticket.
