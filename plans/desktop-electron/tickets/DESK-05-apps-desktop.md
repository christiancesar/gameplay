# DESK-05 · `apps/desktop` com Electron Forge

> Pontos: 5 · Depende de: DESK-04 · Branch `feature/desktop-app`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seções 2, 5.2 e 7. O desktop roda o mesmo `packages/client`. Sem recursos nativos de captura: a transmissão usa o `getDisplayMedia` padrão do Chromium.

## Escopo
- Scaffold com Electron Forge, template `vite-typescript`, adaptado ao monorepo (workspace `apps/desktop`, scripts na raiz pelo Turborepo). Conferir a doc atual do Forge e do plugin Vite antes.
- `src/main/main.ts`: janela, protocolo `app://gameplay` servindo o renderer (com fallback para o `index.html`), CSP, trava de navegação (links externos no browser do sistema), `contextIsolation`, `sandbox`, sem `nodeIntegration`, fuses do Forge.
- `src/main/ipc.ts` e `src/main/modules/` criados vazios, prontos para o DESK-06.
- `src/preload/preload.ts` sem canais ainda.
- `src/renderer/`: monta o `App` do `packages/client` com uma `desktopPlatform` inicial (`kind: 'desktop'`, capacidades do Chromium, servidor e token em memória até o DESK-06).
- Tela de escolha do servidor na primeira abertura: View nova com story no `packages/client`, mostrada quando a plataforma não tem servidor.
- Makers só para Linux nesta fase (deb e zip), sem assinatura e sem atualização.

## Fora do escopo
IPC e `safeStorage` (DESK-06). Captura nativa e áudio (fase 2). Assinatura, publicação e atualização (DESK-10 e DESK-11).

## Checklist
- [ ] Forge e plugin Vite funcionando no workspace, com o renderer importando o código-fonte do `packages/client`
- [ ] Tailwind e router plugin funcionando no renderer
- [ ] Protocolo `app://`, CSP, trava de navegação e flags de segurança
- [ ] `desktopPlatform` inicial
- [ ] View e rota de escolha do servidor, com story
- [ ] `npm run make -w desktop` gerando o deb no Linux
- [ ] Docs: `AGENTS.md` com os comandos do desktop
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes
- [ ] `npm run start -w desktop` abre a janela, pede o servidor, faz login no self-hosted local, entra numa sala, fala por voz e transmite tela com o seletor padrão
- [ ] DevTools do desktop: `window.require` e `process` indefinidos no renderer
- [ ] Link externo abre no browser do sistema, não na janela do app
- [ ] O pacote gerado instala e abre no Linux
- [ ] Web sem regressão (testes e uso manual)

## Critério de aceite
O app desktop abre no Linux e faz no self-hosted o mesmo que o web, a partir do mesmo código.
