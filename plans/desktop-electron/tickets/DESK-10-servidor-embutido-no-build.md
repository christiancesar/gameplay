# DESK-10 · Servidor de produção embutido no build

> Pontos: 3 · Depende de: DESK-07 · Branch `feature/desktop-app`, até o merge da PR do DESK-05 a DESK-07; depois, `feature/desktop-fixed-server` saída da `dev`

## Contexto
`../02-tech-plan.md`, seções 7 e 8. Hoje o app pede o endereço do servidor na primeira abertura (`Platform.server.chooser`) e o main guarda a escolha em `userData/server.json`. Para distribuir, ninguém pode apontar o app para um servidor alheio: o build empacotado fala com um servidor só, o de produção.

O endereço **não é constante no código**. O repositório é aberto a quem quiser montar o próprio app, então o endereço vem de uma env lida na hora do build, como já é com o Sentry.

## Escopo
- Duas envs em `apps/desktop/.env` e no `.env.example`: `VITE_APP_ENV` (`development` ou `production`, obrigatória, qualquer outro valor para o app e o empacotamento) e `VITE_SERVER_URL`, validada com `serverOriginSchema` (`@gameplay/contracts`). Em `production` a URL é obrigatória e não pode ser vazia; em `development` pode ficar vazia e a primeira tela pergunta o servidor (preenchida, vale como fixa também). O `vite.main.config.ts` e o `vite.renderer.config.ts` embutem o valor com `define`, como já fazem com `VITE_SENTRY_*`.
- Main: o `ServerAddressService` recebe o endereço fixo (ou `null`). Com endereço fixo, `current()` devolve sempre ele, `set()` recusa e o `userData/server.json` é ignorado (um arquivo antigo de quem já testou não vale).
- Renderer: com endereço fixo, `createDesktopPlatform` não monta o `chooser`, então a tela de escolha não aparece. Sem endereço fixo (desenvolvimento), tudo como hoje.
- Canal `server:set-url` continua no contrato (o dev usa), mas o main o recusa quando o endereço é fixo.
- O hook `prePackage` do Forge aplica a mesma regra: empacotar com `VITE_APP_ENV=production` e sem `VITE_SERVER_URL` falha com mensagem clara, então nenhum instalador de produção sai com a tela de escolha. `VITE_APP_ENV` também é o nome do ambiente no Sentry quando `VITE_SENTRY_ENVIRONMENT` está vazia.
- CSP em `content-security-policy.ts`: com o endereço fixo, `connect-src` e `img-src` fecham nessa origem (a Cloudflare, para TURN e SFU, não entra: o WebRTC não passa pelo `connect-src`), no lugar de `https:` e `wss:` abertos. Sem endereço fixo (dev), o CSP fica como hoje.
- Specs do service (com e sem endereço fixo), do CSP e do `desktop-platform` (sem `chooser` quando fixo).

## Fora do escopo
Release, versão e GitHub Actions (DESK-11). Trocar de servidor dentro do app empacotado. Qualquer coisa de Windows.

## Checklist
- [x] `VITE_APP_ENV` e `VITE_SERVER_URL` no `.env.example`, validadas pela regra de ambiente, embutidas no main e no renderer
- [x] `ServerAddressService` com endereço fixo (`current`, `set` recusado, arquivo ignorado) e specs
- [x] `desktop-platform` sem `chooser` quando fixo, com spec
- [x] Hook do Forge que aplica a regra (produção sem servidor não empacota)
- [x] CSP fechado na origem fixa, com spec
- [x] Commit a cada passo verde

## Checklist de validação
- [x] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes
- [x] `VITE_APP_ENV=development` e `VITE_SERVER_URL` vazia: abre a tela de escolha como antes
- [x] `VITE_APP_ENV=production` sem `VITE_SERVER_URL`, ou sem `VITE_APP_ENV`: o empacotamento falha com a mensagem da regra
- [x] `VITE_APP_ENV=production` com `VITE_SERVER_URL`: o app empacotado abre direto no login do servidor, sem tela de escolha, mesmo com um `server.json` antigo apontando para outro endereço
- [x] No app empacotado, `window.gameplayDesktop['server:set-url']('https://outro.example.com')` rejeita
- [x] No DevTools do app empacotado, uma requisição a outra origem é bloqueada pelo CSP

## Critério de aceite
O instalador distribuído só conversa com o servidor definido na env do build, e a tela de escolha só existe em desenvolvimento.

## Notas da execução
## Notas da execução (2026-10-28)

Feito na `feature/desktop-app`.

O que foi feito:
- `VITE_SERVER_URL` no `.env.example`, embutida no main (`define` no `vite.main.config.ts`) e lida pelo renderer (o Vite já expõe os `VITE_*`). `fixedServerFrom` (`utils/fixed-server.ts`) valida com `serverOriginSchema`: vazio é "sem servidor", valor inválido para o app na partida.
- `ServerAddressService` ganhou o endereço fixo: `load()` não lê o `server.json`, `set()` recusa (`This build talks to one server only`). O canal `server:set-url` continua no contrato, mas o main o recusa.
- `createDesktopPlatform` recebe `serverFixed` e não monta o `chooser`; sem `chooser`, o `App` não mostra a tela de escolha.
- `contentSecurityPolicy(fixedServer)` no lugar da constante: com servidor fixo, `connect-src` e `img-src` ficam só no servidor e no `ws`/`wss` dele; sem servidor (dev) fica aberto como antes.
- Hook `prePackage` no `forge.config.ts` recusa empacotar sem `VITE_SERVER_URL`. Ele lê o `.env` e as variáveis do ambiente (`loadEnv`), então o CI só precisa exportar a variável.
- Specs: `fixed-server` (6), CSP (4), service com servidor fixo (2), plataforma com e sem `chooser` (2). Desktop com 69 testes; typecheck, lint e format verdes. Client passou 1300/1300 sozinho (2 falhas na primeira rodada completa, flaky sob carga, sem relação com a mudança).

Validação no app empacotado (Xvfb, porta de depuração):
- Regra de ambiente (revisada no mesmo dia, a pedido do usuário: duas envs, `VITE_APP_ENV` e `VITE_SERVER_URL`): produção sem servidor e `VITE_APP_ENV` ausente falham no `package` com a mensagem certa; `development` sem servidor empacota e o app mostra "Escolha seu servidor" (`server:get-url` nulo, `set-url` aceito).
- Produção com `VITE_SERVER_URL`:
- (Primeira rodada, antes da revisão.) Com `VITE_SERVER_URL=http://localhost:3333` e um `server.json` antigo apontando para `old.example.com`: o app ignorou o arquivo, abriu direto no login, `server:get-url` devolveu `http://localhost:3333`, `server:set-url('https://other.example.com')` foi rejeitado e um `fetch('https://example.com')` foi bloqueado pelo CSP.
- Com `VITE_SERVER_URL=https://gameplay.oikos.company`: o app aponta para a produção, mas **a API de produção ainda bloqueia o app por CORS** (`PreflightMissingAllowOriginHeader` para `app://gameplay`). A produção roda a release `4041a26`, anterior ao CORS do desktop do DESK-04, que está na `feature/desktop-app`. Sem fazer deploy da API com esse código, o instalador de produção abre em "Algo deu errado". **Isso precisa acontecer antes da primeira release do DESK-11.**

Achado fora do escopo, já existia antes desta mudança: o CSP bloqueia a criação de um worker a partir de `blob:` (`script-src 'self'`, sem `worker-src`). Não identifiquei quem o cria (talvez o Sentry). Não mexi, porque liberar `worker-src blob:` muda a postura de segurança; fica para decidir.

Suposições:
- *(suposição)* A Cloudflare não entra no CSP: TURN e SFU são WebRTC e passam pela API, que não é restringida pelo `connect-src`. Conferido só até o login; a chamada de voz e a transmissão não foram refeitas.
- *(suposição)* `npm run package` exercita o mesmo hook que o `make`; rodei o `package` por ser mais rápido.
- *(suposição)* Um servidor `http://localhost` fixo no build é aceito (a regra do `serverOriginSchema`), para testar localmente.

