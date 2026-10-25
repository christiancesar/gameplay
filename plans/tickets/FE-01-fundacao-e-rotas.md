# FE-01 · Ferramentas, infra do client e rotas em `src/app/`

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: nenhum · Onda 1

## Contexto
O `apps/web` só tem Views e stories. Este ticket instala as ferramentas e monta o esqueleto de rotas, com os guards funcionando, para os próximos tickets só preencherem ViewModels e Screens.

## Escopo
- Instalar as dependências da seção "Ferramentas a instalar" do `plans/05-web-plan.md`.
- `vite.config.ts`: `tanstackRouter({ target: 'react', autoCodeSplitting: true, routesDirectory: './src/app/routes', generatedRouteTree: './src/app/route-tree.gen.ts' })` antes do `react()`; `server.proxy` de `/api` e `/socket.io` (`ws: true`) para `http://localhost:3333`; projeto `unit` (jsdom, `src/**/*.spec.ts`) no `test.projects`, ao lado do `storybook`.
- Ignorar `route-tree.gen.ts` no `.oxlintrc.json` e no `.oxfmtrc.json`.
- `shared/lib/http.ts` (Axios + interceptor de erro do contrato), `query-client.ts`, `auth-client.ts` (Better Auth com `usernameClient`, `twoFactorClient`, `adminClient`), `socket.ts` (factory tipada, `autoConnect: false`).
- `src/app/app.tsx`, `src/app/router.tsx` (context `{ queryClient, auth }`), `main.tsx` enxuto. Remover `src/App.tsx`. Tema aplicado por um provider em vez do `classList.add('dark')` fixo.
- Todos os arquivos de rota da árvore do `05-web-plan.md`, com `validateSearch` (schemas `*.search.ts`), guards `_guest`, `_authed` e `admin`, e Screen provisória por rota.
- Devtools do router e do query só em dev.

## Fora do escopo
ViewModels e Screens reais (FE-02 em diante), conexão real do socket (FE-05).

## Referências
- `plans/05-web-plan.md`
- `plans/00-requirements.md` 3.4
- `packages/contracts/src/http/error.ts`, `realtime/events.ts`
- Docs atuais do TanStack Router (plugin do Vite) e do Better Auth client, via Context7

## Checklist
- [ ] Branch `feature/web-routing` (ou a combinada com o usuário)
- [ ] Dependências instaladas
- [ ] Vite: plugin do router, proxy e projeto `unit`
- [ ] `shared/lib/*` com teste do interceptor de erro
- [ ] `src/app/` com router e providers
- [ ] Árvore de rotas completa com guards
- [ ] `typecheck`, `lint`, `format:check` e `test` verdes; stories sem mudança
- [ ] Commit

## Critério de aceite
Com a API rodando: `/` sem sessão vai para `/sign-in?redirect=/`; com sessão `/sign-in` volta para `/`; `/admin` barra usuário comum e redireciona o admin para `/admin/users`; `/i/QUALQUER` abre a rota do convite. O router devtools mostra a árvore gerada a partir de `src/app/routes`.

## Notas da execução (parcial, 2026-10-25)

Começado no Claude Code, na branch `docs/web-plan`, e passado para o OpenCode no meio. Typecheck e oxlint passam nos arquivos novos; nada está ligado ao app ainda.

Feito:
- Dependências instaladas (commit próprio).
- `vite.config.ts`: `tanstackRouter` (rotas em `src/app/routes`, árvore em `src/app/route-tree.gen.ts`), proxy de `/api` e `/socket.io` para a 3333, projeto Vitest `unit` (jsdom, `src/**/*.spec.{ts,tsx}`).
- `route-tree.gen.ts` ignorado no `.oxlintrc.json` e no `.oxfmtrc.json`.
- `shared/lib/api-error.ts` (`ApiError`, `toApiError`, com `api-error.spec.ts`), `http.ts` (Axios com o interceptor), `query-client.ts` (sem retry em 4xx), `auth-client.ts` (Better Auth com username, twoFactor, admin e os campos extras do user; tipo `AuthSession`), `socket.ts` (`createSocket()` tipado, `autoConnect: false`).
- `modules/auth/model/services/session.query.ts` (`sessionQueryOptions`, chave `['session']`, `staleTime: Infinity`).
- Search schemas: `modules/auth/model/sign-in.search.ts`, `sign-up.search.ts`, `modules/settings/model/settings.search.ts`, `modules/servers/model/server.search.ts`.
- `modules/admin/model/admin-tab.ts` (`ADMIN_TABS`).

Falta:
1. Fazer `user-settings-dialog.view.tsx`, `server-settings-dialog.view.tsx` e `admin-layout.view.tsx` importarem `USER_SETTINGS_SECTIONS`, `SERVER_SETTINGS_SECTIONS` e `ADMIN_TABS` do Model (hoje as constantes estão duplicadas nas Views). Manter os re-exports se alguma story usar.
2. Store de tema (`modules/settings/view-models/stores/theme.store.ts`, zustand com `persist`, tipo `Theme` do contracts) e ViewModel de idioma (`use-language.view-model.ts`, mesmo formato do `fixtures/language.ts`).
3. `src/app/router-context.ts` (`{ queryClient }`), `router.tsx` (`createRouter`, `defaultPreload: 'intent'`, `declare module Register`), `root-layout.tsx` (Outlet + devtools), `pending.screen.tsx` (Screen provisória única que mostra o `routeId`, usada pelas rotas até cada ticket trazer a Screen real), `app.tsx` (QueryClientProvider, TooltipProvider, RouterProvider, Toaster com o tema; aplica a classe `dark` com `useLayoutEffect`).
4. `main.tsx` só com i18n, css e `<App />`; apagar `src/App.tsx`.
5. Rotas:
   - `_guest.tsx`: `beforeLoad` com `ensureQueryData(sessionQueryOptions)`, redirect para `/` se houver sessão. Componente `GuestLayoutScreen` (`modules/auth/screens`) com `AuthLayoutView` + `Outlet` + ViewModel de idioma.
   - `_authed.tsx`: `validateSearch: settingsSearchSchema`, sem sessão redirect para `/sign-in` com `search: { redirect: location.href }`, devolve `{ session }` no context.
   - `admin.tsx`: `user.role !== 'admin'` vai para `/`; sem `twoFactorEnabled` vai para `/admin/setup`; com 2FA, `/admin/setup` vai para `/admin/users`.
   - `admin/_panel.tsx` com `AdminPanelScreen` (`AdminLayoutView` + `Outlet`; ViewModel `use-admin-panel` lê a aba do pathname e navega para `/admin/${tab}`). `_panel/index.tsx` redireciona para `/admin/users`.
   - As demais rotas da árvore do `05-web-plan.md` usam `component: PendingScreen`.
6. Gerar a árvore (`npx vite build` ou `npm run dev` uma vez) e commitar o `route-tree.gen.ts`, porque o `tsc -b` do build roda antes do Vite.
7. `npm run typecheck`, `lint`, `format:check` e `test` verdes; conferir os critérios de aceite com a API rodando.

Decisões tomadas até aqui *(suposições, confirmar com o usuário)*:
- O context do router leva só `{ queryClient }`; a sessão sai do `ensureQueryData` nos `beforeLoad` e o `_authed` a repassa no context. Desvio do plano, que previa `{ queryClient, auth }`.
- Constantes de seção e aba ficam no Model (`*.search.ts`, `admin-tab.ts`) e as Views podem importá-las, junto com os `*.schema.ts`.
- `PendingScreen` única em `src/app/` em vez de um stub por módulo.
