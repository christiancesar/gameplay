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
- `plans/[complete]-core-product/00-requirements.md` 3.4 (estrutura) e seção de testes

## Checklist
- [x] Peer bot
- [x] Cenários principais
- [x] Commit

## Critério de aceite
`npx cypress run` passa com a stack local.

## FE-14a (antes da voz)

- Cypress em `apps/web/cypress` (`e2e/`, `support/`, `tasks/`), rodando contra a API e o Vite locais.
- Dados por `cy.task` direto no banco (Prisma): key de cadastro, usuários e servidores com nomes únicos por execução, apagados no fim. Sem banco separado (decisão do usuário).
- Cenários: login por email e username, 2FA do admin, cadastro com key, convite (sem e com sessão), criar servidor e abrir a tela dele, configurações (tema, idioma, username), limites no admin.
- Playwright fica só como conferência rápida do orquestrador, fora do repo.

## FE-14b (depois do FE-09 e FE-10)

- `tasks/peer-bot.ts` headless e os cenários de entrar na sala, transmitir e assistir.

## Notas da execução do FE-14a (2026-10-25)

Feito por um agente Sonnet; conferido pelo Opus rodando a suíte com o código final (26 de 26 em 1 min, banco limpo no fim).

- Cypress 16.2 em `apps/web/cypress` com `@testing-library/cypress`; `cypress/tsconfig.json` próprio. Scripts: `npm run e2e` na raiz (turbo, fora do `npm test`), `npm run e2e:open -w apps/web`, `npm run e2e:typecheck -w apps/web`.
- Roda contra a API na 3333 e o Vite na 5173 (o Better Auth só confia nessa origem). Os dois precisam estar de pé antes.
- Dados por `cy.task` direto no Postgres de dev com `pg`: keys com o mesmo HMAC da API, usuários pelo cadastro real, servidores e convites por SQL, TOTP calculado em Node (RFC 6238). Tudo com prefixo `e2e<6 hex>` e apagado no `after:run`.
- Interface forçada em inglês; logins com `cy.session`.
- Cenários: login (email, username, senha errada, rota protegida), 2FA do admin (setup, código errado, TOTP, código de recuperação), cadastro com key (válida, inválida, reuso), convite (sem e com sessão, auto aprovação ligada e desligada), criar servidor (abrir a tela, nome vazio, limite), configurações (tema, idioma, username), limites no admin (persistem depois de recarregar).

Suposições *(confirmar)*:
- `npm run e2e` força o Chrome (o Electron está obsoleto no Cypress 16). *(suposição)*
- Para não bater no rate limit do Better Auth em dev, os testes mandam um `x-forwarded-for` falso por requisição. Só funciona porque o dev confia no header; em produção o nginx sobrescreve. *(suposição)*
- As tasks escrevem SQL com os nomes de coluna do schema Prisma atual: mudança no schema exige ajuste em `cypress/tasks`. *(suposição)*
- Se a execução cair antes do `after:run`, sobram dados com o prefixo da execução; dá para apagar pelo prefixo. *(suposição)*

## Notas da execução do FE-14b (2026-10-25)

Feito por um agente Sonnet; conferido pelo Opus rodando a suíte inteira de novo (35 de 35 em 1 min 14 s, banco sem dados `e2e`).

- `cypress/tasks/peer-bot.ts`: um Chromium headless do Playwright com mídia falsa, que entra pela interface real (login pela API, abre o servidor). Tasks `bot:start`, `bot:joinRoom`, `bot:leaveRoom`, `bot:mute`, `bot:startShare`, `bot:stopShare`, `bot:watch`, `bot:stopWatching`, `bot:stats`, `bot:waitForMedia`, `bot:stop`; fechado no `after` e no `after:run` mesmo quando um teste falha.
- O Chrome do Cypress recebe as mesmas flags de mídia falsa. `support/rtc-probe.ts` lê bytes de RTP, `framesDecoded` e o estado das conexões na página.
- Voz (5): os dois se veem e conectam com áudio nos dois sentidos, mute aparece no bloco, sair remove o bloco, trocar de sala, sair pelo card.
- Transmissão (4): o bot transmite e o usuário assiste (LIVE, `?watch=`, `framesDecoded > 0`), parar fecha a tela de quem assiste, parar de assistir limpa o `?watch=`, e o usuário transmite pelo diálogo com o bot assistindo.
- 3 execuções completas seguidas, 35 de 35 em todas, sem oscilação.
- Achado: um Vite de dev rodando há muito tempo perdeu o cache de dependências e passou a responder 504 ("Outdated Optimize Dep"). Reiniciar o `npm run dev` resolve.

Suposições *(confirmar)*:
- Um bot por execução; as tasks dele não rodam em specs paralelas. *(suposição)*
- Limites reais de banda e os valores do monitor não são verificados. *(suposição)*
