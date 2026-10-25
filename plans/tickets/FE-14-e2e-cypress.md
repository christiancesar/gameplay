# FE-14 · E2E com Cypress e peer bot

> Pontos: 5 · Modelo sugerido: Opus · Depende de: FE-09 · Onda 6

## Contexto
Os fluxos de voz e transmissão precisam de um segundo participante. O peer bot roda headless via `cy.task`.

## Escopo
- Cypress em `apps/web/cypress` com `e2e/`, `support/` e `tasks/peer-bot.ts`.
- Cenários: login, criar servidor, convite, entrar na sala com o bot, transmitir e assistir.
- Rodar contra a stack do `infra/docker-compose.dev.yml`.

## Fora do escopo
Testes de carga.

## Referências
- `plans/00-requirements.md` 3.4 (estrutura) e seção de testes

## Checklist
- [ ] Peer bot
- [ ] Cenários principais
- [ ] Commit

## Critério de aceite
`npx cypress run` passa com a stack local.
