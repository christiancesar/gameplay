# Tickets: release Windows, assinatura e atualização

Base: `../02-tech-plan.md`. Uma branch por ticket, saindo da `dev` e voltando por PR. Parar depois de cada ticket para revisão do usuário.

| Ticket | Pontos | Dependências | Status |
|---|---:|---|---|
| [WIN-01 Artefatos Squirrel e feed](WIN-01-artefatos-squirrel-e-feed.md) | 5 | DESK-11 | concluído |
| [WIN-02 Assinatura Authenticode no CI](WIN-02-assinatura-authenticode.md) | 8 | WIN-01 | adiado |
| [WIN-03 Atualização automática no Electron](WIN-03-auto-updater.md) | 8 | WIN-01 | em andamento |
| [WIN-04 Promoção, rollback e validação](WIN-04-promocao-rollback.md) | 5 | WIN-03 | em andamento |

## Decisão de hospedagem prevista

O primeiro ticket deve testar S3 como armazenamento dos artefatos Squirrel e o endpoint estável em `gameplay.oikos.company/api/updates`. O GitHub Releases continua como histórico e registro da versão, sem ser a origem principal do feed.
