# DESK-06 · `packages/desktop-bridge` e o IPC tipado

> Pontos: 3 · Depende de: DESK-05 · Branch `feature/desktop-bridge`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seções 3.2, 4 (item 2) e 5.2. Só os canais do próprio app: endereço do servidor e token da sessão. Nada de captura nesta fase.

## Decisão herdada do DESK-05
O teste do cookie reescrito funcionou: **não há token no desktop**. A sessão é o cookie do Chromium, que o cifra com o cofre do sistema. Por isso este ticket **não tem os canais `auth:*` nem o módulo `auth`**, e o `safeStorage`, o token por servidor, o tratamento de 401 por token e o `requireSignature` deixaram de existir. O `desktop-bridge` começa só com os canais `server:*`.

## Escopo
- `packages/desktop-bridge` (`@gameplay/desktop-bridge`): `channels.ts` com zod para `server:get-url` e `server:set-url`; `bridge.ts` com o tipo `DesktopBridge` e os helpers de preload e de main.
- `apps/desktop/src/main/ipc.ts`: registra os canais pelo contrato, valida a entrada com zod e só atende a janela do app no protocolo `app://` (confere o `senderFrame`).
- `src/main/modules/server/`  handlers, services e providers (o endereço fica num arquivo no `userData`, atrás de uma porta), com fakes em `test/`.
- `src/preload/preload.ts`: `contextBridge.exposeInMainWorld('gameplayDesktop', ...)` montado pelo contrato, só funções.
- `desktopPlatform` passa a ler e gravar o endereço pela ponte, no lugar do `localStorage` da página. Com o endereço no main, o CSP e a regra de cookies passam a valer só para a origem escolhida.

## Fora do escopo
Canais de captura, áudio e hardware (fase 2).

## Checklist
- [x] Pacote `desktop-bridge` com specs dos helpers (canal fora do contrato recusado, entrada inválida recusada)
- [x] `ipc.ts` com validação e conferência do `senderFrame`
- [x] Módulo `server` com specs do service usando fakes
- [x] Preload expondo só o contrato
- [x] `desktopPlatform` usando a ponte
- [x] Commit a cada passo verde

## Checklist de validação
- [x] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes
- [x] Fechar e abrir o app mantém o servidor escolhido e a sessão (sem novo login; a sessão é o cookie)
- [x] Logout apaga a sessão: ao reabrir, pede login
- [x] O cookie da sessão não aparece em texto puro na pasta de dados do app (`grep` pelo valor em `~/.config/gameplay`; vale o fuse `EnableCookieEncryption`)
- [x] No DevTools, `window.gameplayDesktop` só tem as funções do contrato; chamar com entrada inválida rejeita
- [x] Nenhum import de `electron` em `packages/client`; `packages/client` só importa tipos do `desktop-bridge`

## Critério de aceite
O desktop guarda servidor e sessão de forma segura entre aberturas, e todo o IPC passa pelo contrato tipado e validado.

## Notas da execução (2026-10-28)

Feito na mesma branch do DESK-05 (`feature/desktop-app`), que ainda não tinha ido para a `dev`. O DESK-06 nasceu de um defeito achado pelo usuário ao testar o app instalado no Wayland: **as imagens estavam quebradas**. A API devolve URLs relativas à página (`/uploads/avatars/...`), que no desktop viram `app://gameplay/uploads/...`. A correção ficou aqui porque pede que o main saiba qual é o servidor.

O que foi feito:
- `packages/desktop-bridge` (7 testes): `names.ts`, `channels.ts`, `bridge.ts` e `register.ts`, como no tech plan (seção 3.2). `@gameplay/contracts` ganhou `isServerOrigin`, `isLoopbackHost` e `serverOriginSchema`; a regra de endereço da tela de escolha do client passou a usar a mesma.
- Main: `ipc.ts` (`registerIpc`), `modules/server/` (provider abstrato, provider de arquivo, fake, service com 4 testes, handlers e `server.module.ts`), `uploads-url.ts` (3 testes) e `app-protocol.ts` buscando `/uploads/*` no servidor (só `GET`). O cookie passou a ser reescrito só para as respostas do servidor escolhido.
- Preload e renderer: o preload expõe `window.gameplayDesktop`; o renderer pede o servidor ao main antes de montar o app, e `createDesktopPlatform` recebe a ponte (o `localStorage` saiu). No client, `chooser.choose` pode ser assíncrono e a tela de escolha espera o host guardar a escolha antes de seguir.

Validação:
- Typecheck, lint, format e `npm test` verdes: ponte 7, desktop 21 (cookie, caminho de arquivo, segurança, escolha de fonte, servidor, uploads), client 186 arquivos e 1281 testes, API 375.
- No app **empacotado** (com os fuses), dirigido pela porta de depuração do Chromium em Xvfb, contra a API local:
  - `window.gameplayDesktop` tem só `server:get-url` e `server:set-url`; `ipcRenderer` e `require` indefinidos.
  - `server:set-url` recusa `http://evil.example.com` e uma URL com caminho.
  - `/uploads/probe/test.png` pelo app: 200, `image/png`, e a imagem carrega (`naturalWidth` 192).
  - O cookie da sessão é `Secure` e `SameSite=None`, e o valor **não aparece em texto puro** na pasta de dados (cookies cifrados pelo fuse).
  - Segunda abertura com a mesma pasta de dados: cai direto na home (servidor e sessão mantidos). Depois de sair, a terceira abertura pede o login e já sabe o servidor.

Suposições:
- *(suposição)* O arquivo do servidor é `userData/server.json`, sem cifra: o endereço não é segredo.
- *(suposição)* O CSP continua aberto para `https:`, `wss:` e `localhost`: fechar na origem escolhida exigiria a verificação do servidor (`/api/health`) passar para o main e recarregar a página depois da escolha, porque o CSP é decidido quando a página carrega. Fica para o endurecimento (DESK-10).
- *(suposição)* O teste `/uploads/../api/health` dá 200 porque o navegador resolve os pontos antes de a requisição sair (chega como `/api/health`, que cai no `index.html`); a proteção contra `..` está testada em `uploads-url` e `asset-path`.
- O app não valida o ponto em que o usuário **troca** de servidor depois da primeira escolha: não há tela para isso ainda (apagar o `server.json` faz o app perguntar de novo).
