# DESK-06 · `packages/desktop-bridge` e o IPC tipado

> Pontos: 3 · Depende de: DESK-05 · Branch `feature/desktop-bridge`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seções 3.2, 4 (item 2) e 5.2. Só os canais do próprio app: endereço do servidor e token da sessão. Nada de captura nesta fase.

## Decisão herdada do DESK-05
O teste do cookie reescrito decide se o desktop guarda token:
- **Cookie funcionou (Bearer fora):** os canais `auth:*` e o módulo `auth` **não existem**; o login fica no cookie do Chromium, que o cifra com o cofre do sistema. O `desktop-bridge` começa só com os canais `server:*`.
- **Cookie não funcionou (Bearer fica):** valem os canais `auth:*` abaixo, e entram três itens de endurecimento:
  - o token é guardado **por servidor** (a chave é a origem do servidor, para nunca mandar o token de um para outro; o `Platform.server.session` passa a receber o endereço);
  - **401** de uma rota autenticada, ou `session:revoked` no socket, apaga o token e leva ao login;
  - `bearer({ requireSignature: true })` na API, com teste, já que o app só envia o token que o servidor entregou.

## Escopo
- `packages/desktop-bridge` (`@gameplay/desktop-bridge`): `channels.ts` com zod para `server:get-url` e `server:set-url` e, se o Bearer ficar, `auth:get-token`, `auth:set-token`, `auth:clear-token`; `bridge.ts` com o tipo `DesktopBridge` e os helpers de preload e de main.
- `apps/desktop/src/main/ipc.ts`: registra os canais pelo contrato, valida a entrada com zod e só atende a janela do app no protocolo `app://` (confere o `senderFrame`).
- `src/main/modules/server/` e, se o Bearer ficar, `src/main/modules/auth/`: handlers, services e providers (`auth` com o `safeStorage` atrás de uma porta), com fakes em `test/`.
- `src/preload/preload.ts`: `contextBridge.exposeInMainWorld('gameplayDesktop', ...)` montado pelo contrato, só funções.
- `desktopPlatform` passa a usar a ponte para servidor e token, no lugar da memória.

## Fora do escopo
Canais de captura, áudio e hardware (fase 2).

## Checklist
- [ ] Pacote `desktop-bridge` com specs dos helpers (canal fora do contrato recusado, entrada inválida recusada)
- [ ] `ipc.ts` com validação e conferência do `senderFrame`
- [ ] Módulos `server` e `auth` com specs dos services usando fakes
- [ ] Preload expondo só o contrato
- [ ] `desktopPlatform` usando a ponte
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes
- [ ] Fechar e abrir o app mantém o servidor escolhido e a sessão (sem novo login)
- [ ] Logout apaga o token: ao reabrir, pede login
- [ ] O token não aparece em texto puro na pasta de dados do app (`grep` pelo valor em `~/.config/<app>`)
- [ ] No DevTools, `window.gameplayDesktop` só tem as funções do contrato; chamar com entrada inválida rejeita
- [ ] Nenhum import de `electron` em `packages/client`; `packages/client` só importa tipos do `desktop-bridge`

## Critério de aceite
O desktop guarda servidor e sessão de forma segura entre aberturas, e todo o IPC passa pelo contrato tipado e validado.
