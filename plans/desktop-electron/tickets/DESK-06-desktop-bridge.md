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
- [ ] Pacote `desktop-bridge` com specs dos helpers (canal fora do contrato recusado, entrada inválida recusada)
- [ ] `ipc.ts` com validação e conferência do `senderFrame`
- [ ] Módulo `server` com specs do service usando fakes
- [ ] Preload expondo só o contrato
- [ ] `desktopPlatform` usando a ponte
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes
- [ ] Fechar e abrir o app mantém o servidor escolhido e a sessão (sem novo login; a sessão é o cookie)
- [ ] Logout apaga a sessão: ao reabrir, pede login
- [ ] O cookie da sessão não aparece em texto puro na pasta de dados do app (`grep` pelo valor em `~/.config/gameplay`; vale o fuse `EnableCookieEncryption`)
- [ ] No DevTools, `window.gameplayDesktop` só tem as funções do contrato; chamar com entrada inválida rejeita
- [ ] Nenhum import de `electron` em `packages/client`; `packages/client` só importa tipos do `desktop-bridge`

## Critério de aceite
O desktop guarda servidor e sessão de forma segura entre aberturas, e todo o IPC passa pelo contrato tipado e validado.
