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
