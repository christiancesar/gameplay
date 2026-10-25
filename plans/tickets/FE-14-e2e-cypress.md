# FE-14 · E2E com Cypress e peer bot

> Dividido em 2026-10-25 (decisão do usuário): **FE-14a** agora, depois do BE-17, com a estrutura e os fluxos que já existem; **FE-14b** depois do FE-09 e do FE-10, com o peer bot e os cenários de voz e transmissão.

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

## FE-14a (antes da voz)

- Cypress em `apps/web/cypress` (`e2e/`, `support/`, `tasks/`), rodando contra a API e o Vite locais.
- Dados por `cy.task` direto no banco (Prisma): key de cadastro, usuários e servidores com nomes únicos por execução, apagados no fim. Sem banco separado (decisão do usuário).
- Cenários: login por email e username, 2FA do admin, cadastro com key, convite (sem e com sessão), criar servidor e abrir a tela dele, configurações (tema, idioma, username), limites no admin.
- Playwright fica só como conferência rápida do orquestrador, fora do repo.

## FE-14b (depois do FE-09 e FE-10)

- `tasks/peer-bot.ts` headless e os cenários de entrar na sala, transmitir e assistir.
