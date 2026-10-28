# DESK-03 · Porta `Platform` no client

> Pontos: 3 · Depende de: DESK-02 · Branch `feature/desktop-platform-port`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seção 3.1. O client precisa saber o que a plataforma onde roda consegue fazer, sem importar nada de browser específico ou de Electron nos ViewModels.

## Escopo
- `packages/client/src/shared/platform/platform.ts`: tipo `Platform` com `kind`, `capabilities` e `capture` (`listSources`, `start`), como no tech plan. `server` fica para o DESK-04.
- `platform-provider.tsx` e `use-platform.ts` (context e hook `usePlatform()`) e `current-platform.ts` (registro de módulo para os controllers fora do React). O `App` recebe a `platform` por prop.
- `createBrowserPlatform` em `modules/screen-share/model/services/browser-platform.service.ts` (exportada por `@gameplay/client`; o `apps/web/src/main.tsx` monta `<App platform={createBrowserPlatform()} />`): implementação browser. `capture.start` usa o `acquireScreen` de hoje; `listSources` devolve vazio; `capabilities` vêm das regras que já existem em `capture-platform.ts` (áudio de aba, tela inteira etc.).
- O `share.controller` (a ponta do compartilhamento de tela que monta o `ShareSession`) passa a chamar `currentPlatform().capture.start` em vez de `acquireScreen` direto.
- `shared/platform/test/fake-platform.ts`: um fake por arquivo, usado nos specs e no Storybook (decorator).

## Fora do escopo
`server` e token (DESK-04). Implementação desktop (DESK-05 e DESK-06). Seletor de fontes (fase 2).

## Checklist
- [x] Tipo e context da `Platform`, com spec do hook
- [x] `createBrowserPlatform`, com spec
- [x] ViewModel do screen-share usando a porta, specs ajustados
- [x] `FakePlatform` e decorator do Storybook
- [x] Docs: `AGENTS.md` cita a porta na tabela de camadas (Model)
- [x] Commit a cada passo verde

## Checklist de validação
- [x] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes
- [x] `grep -rn "acquireScreen" packages/client/src/modules` só no service/porta, nenhum ViewModel chamando direto
- [x] Nenhum import de `electron` ou de `apps/*` em `packages/client`
- [x] No web, compartilhar tela com e sem áudio funciona como antes (manual, no self-hosted ou `npm run dev`)
- [x] Stories de compartilhamento passando com a `FakePlatform`

## Critério de aceite
O web compartilha tela exatamente como antes, agora pela porta `Platform`.

## Notas da execução (2026-10-28)

O que foi feito:
- `shared/platform/`: `platform.ts` (tipos `Platform`, `PlatformCapabilities`, `CaptureSource`, `CaptureRequest`), `current-platform.ts`, `platform-context.ts`, `platform-provider.tsx`, `use-platform.ts` e `test/fake-platform.ts`.
- `createBrowserPlatform` com `getDisplayMedia` e a leitura do navegador injetáveis (como o `acquireScreen` já fazia). `windowAudio` e `systemAudio` vêm de `audioSupportFor` e `canShareAudio`; `listSources` devolve vazio; `globalHotkeys` é falso.
- `share.controller` chama `currentPlatform().capture.start`. O `App` recebe a `platform`, chama `setCurrentPlatform` e monta o `PlatformProvider`. O `main.tsx` do web monta `<App platform={createBrowserPlatform()} />`.
- Camada `shared-platform` nas fronteiras do oxlint.
- Storybook: decorator global com `PlatformProvider` e uma `FakePlatform`.
- Specs novos: `current-platform`, `use-platform` e `browser-platform.service` (7 testes). `AGENTS.md` cita a porta.

Validação:
- Typecheck, lint, format verdes. Client: 178 arquivos e 1253 testes (eram 175 e 1246; +3 arquivos e +7 testes, nenhum removido).
- `grep acquireScreen`: só no próprio `screen-capture.ts`, no `createBrowserPlatform`, na dependência injetada do `ShareSession` e na chamada do `share.controller` pela porta. Nenhum import de `electron` nem de `apps/*` no client.
- Cypress `screen-share` (4) e `voice` (5), 9 de 9: a captura real (stream falso do Chrome) passa pela porta.

Suposições:
- *(suposição, desfeita no DESK-05, ver a revisão abaixo)* A implementação do browser mora no client e não em `apps/web/src/browser-platform.ts`, como o ticket dizia: ela usa regras internas do client, e o `apps/web` só importa o que o pacote exporta. O desktop também vai reaproveitá-la na fase 1.
- *(suposição)* `capture.start` recebe `{ options, sourceId }` com as opções que o `ShareSession` já monta, e não `{ sourceId, audio, video }` como no rascunho do tech plan. Assim a captura do browser não muda; o tech plan foi corrigido.
- *(suposição)* O registro `currentPlatform()` existe junto com o context porque o `share.controller` vive fora do React. O `App` o preenche no corpo do componente (uma atribuição idempotente).
- *(suposição)* As capabilities ainda não são lidas por nenhum ViewModel: o `audioSupportFor` continua decidindo o áudio. Elas passam a valer no desktop (DESK-07 em diante).

## Revisão no DESK-05 (2026-10-28)

O usuário apontou que a suposição acima estava errada: o client define a interface e **cada host a implementa**. `createBrowserPlatform` foi para `apps/web/src/browser-platform.ts` (commit `740a95f`), e a plataforma do desktop é independente dela. O client passou a exportar, na entrada `@gameplay/client/platform`, só a interface e as peças que um host com navegador dentro divide: `acquireScreen` e a nova regra `audioCapabilitiesOf` (com spec), que saiu do antigo `createBrowserPlatform`. O spec da plataforma do browser foi para o `apps/web`, que ganhou Vitest (4 testes). O motivo da primeira versão (usar regras internas do client) se resolveu exportando essas peças em vez de uma `Platform` pronta.
