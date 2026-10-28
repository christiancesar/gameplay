# DESK-10 · Servidor de produção embutido no build

> Pontos: 3 · Depende de: DESK-07 · Branch `feature/desktop-app`, até o merge da PR do DESK-05 a DESK-07; depois, `feature/desktop-fixed-server` saída da `dev`

## Contexto
`../02-tech-plan.md`, seções 7 e 8. Hoje o app pede o endereço do servidor na primeira abertura (`Platform.server.chooser`) e o main guarda a escolha em `userData/server.json`. Para distribuir, ninguém pode apontar o app para um servidor alheio: o build empacotado fala com um servidor só, o de produção.

O endereço **não é constante no código**. O repositório é aberto a quem quiser montar o próprio app, então o endereço vem de uma env lida na hora do build, como já é com o Sentry.

## Escopo
- Env `VITE_SERVER_URL` em `apps/desktop/.env` e no `.env.example`, validada com `serverOriginSchema` (`@gameplay/contracts`). O `vite.main.config.ts` e o `vite.renderer.config.ts` embutem o valor com `define`, como já fazem com `VITE_SENTRY_*`.
- Main: o `ServerAddressService` recebe o endereço fixo (ou `null`). Com endereço fixo, `current()` devolve sempre ele, `set()` recusa e o `userData/server.json` é ignorado (um arquivo antigo de quem já testou não vale).
- Renderer: com endereço fixo, `createDesktopPlatform` não monta o `chooser`, então a tela de escolha não aparece. Sem endereço fixo (desenvolvimento), tudo como hoje.
- Canal `server:set-url` continua no contrato (o dev usa), mas o main o recusa quando o endereço é fixo.
- Empacotar sem `VITE_SERVER_URL` falha com mensagem clara (hook do Forge em `forge.config.ts`): nunca sai um instalador com a tela de escolha. `npm run desktop` (dev) continua aceitando a env vazia.
- CSP em `content-security-policy.ts`: com o endereço fixo, `connect-src` e `img-src` fecham nessa origem (mais a Cloudflare, para TURN e SFU), no lugar de `https:` e `wss:` abertos. Sem endereço fixo (dev), o CSP fica como hoje.
- Specs do service (com e sem endereço fixo), do CSP e do `desktop-platform` (sem `chooser` quando fixo).

## Fora do escopo
Release, versão e GitHub Actions (DESK-11). Trocar de servidor dentro do app empacotado. Qualquer coisa de Windows.

## Checklist
- [ ] `VITE_SERVER_URL` no `.env.example`, validada, embutida no main e no renderer
- [ ] `ServerAddressService` com endereço fixo (`current`, `set` recusado, arquivo ignorado) e specs
- [ ] `desktop-platform` sem `chooser` quando fixo, com spec
- [ ] Hook do Forge que recusa empacotar sem a env
- [ ] CSP fechado na origem fixa, com spec
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes
- [ ] `npm run desktop` sem a env: abre a tela de escolha como antes
- [ ] `npm run desktop:make` sem a env: falha com a mensagem pedindo `VITE_SERVER_URL`
- [ ] `npm run desktop:make` com a env: o app empacotado abre direto no login do servidor, sem tela de escolha, mesmo com um `server.json` antigo apontando para outro endereço
- [ ] No app empacotado, `window.gameplayDesktop['server:set-url']('https://outro.example.com')` rejeita
- [ ] No DevTools do app empacotado, uma requisição a outra origem é bloqueada pelo CSP

## Critério de aceite
O instalador distribuído só conversa com o servidor definido na env do build, e a tela de escolha só existe em desenvolvimento.

## Notas da execução
(preencher ao concluir, com as suposições marcadas como *(suposição)*)
