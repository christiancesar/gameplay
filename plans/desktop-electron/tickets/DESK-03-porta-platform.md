# DESK-03 · Porta `Platform` no client

> Pontos: 3 · Depende de: DESK-02 · Branch `feature/desktop-platform-port`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seção 3.1. O client precisa saber o que a plataforma onde roda consegue fazer, sem importar nada de browser específico ou de Electron nos ViewModels.

## Escopo
- `packages/client/src/shared/platform/platform.ts`: tipo `Platform` com `kind`, `capabilities` e `capture` (`listSources`, `start`), como no tech plan. `server` fica para o DESK-04.
- `platform-context.tsx`: provider e hook `usePlatform()`. O `App` recebe a `platform` por prop.
- `apps/web/src/browser-platform.ts`: implementação browser. `capture.start` usa o `acquireScreen` de hoje; `listSources` devolve vazio; `capabilities` vêm das regras que já existem em `capture-platform.ts` (áudio de aba, tela inteira etc.).
- O ViewModel do compartilhamento de tela passa a chamar `platform.capture.start` em vez de `acquireScreen` direto.
- `shared/platform/test/fake-platform.ts`: um fake por arquivo, usado nos specs e no Storybook (decorator).

## Fora do escopo
`server` e token (DESK-04). Implementação desktop (DESK-05 e DESK-06). Seletor de fontes (fase 2).

## Checklist
- [ ] Tipo e context da `Platform`, com spec do hook
- [ ] `browserPlatform` no web, com spec
- [ ] ViewModel do screen-share usando a porta, specs ajustados
- [ ] `FakePlatform` e decorator do Storybook
- [ ] Docs: `AGENTS.md` cita a porta na tabela de camadas (Model)
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes
- [ ] `grep -rn "acquireScreen" packages/client/src/modules` só no service/porta, nenhum ViewModel chamando direto
- [ ] Nenhum import de `electron` ou de `apps/*` em `packages/client`
- [ ] No web, compartilhar tela com e sem áudio funciona como antes (manual, no self-hosted ou `npm run dev`)
- [ ] Stories de compartilhamento passando com a `FakePlatform`

## Critério de aceite
O web compartilha tela exatamente como antes, agora pela porta `Platform`.
