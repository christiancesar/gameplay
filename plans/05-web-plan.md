# 05 · Plano do frontend (`apps/web`)

> Data: 2026-10-25. Base: `00-requirements.md` 3.4 e 3.5, `02-core-flows.md`, contrato em `packages/contracts`.
> Tickets em `tickets/FE-*.md` (índice em `tickets/README.md`).
> Desde 2026-10-28 (DESK-02) o front-end mora em `packages/client`: os caminhos `src/...` deste plano são relativos a `packages/client/src`. O `apps/web` é só a casca do browser (e o Cypress).

## Estado atual

Pronto e não muda: React 19, Vite 8, TS 6, Tailwind 4, shadcn em `src/shared/ui`, `cn` (pacote do shadcn, substitui clsx + tailwind-merge), React Hook Form + Zod, i18next, sonner, Storybook 10 com 157 interaction tests, `@gameplay/contracts`.

Todas as Views dos fluxos F1 a F13 existem em `src/modules/*/views` com stories. Falta tudo o que fica acima delas: router, client HTTP, query, store, socket, client de auth, ViewModels, Screens e rotas. O `src/App.tsx` é só um placeholder.

## Decisões (usuário, 2026-10-25)

- Roteamento centralizado em **`src/app/`**.
- Sala de voz **fora da URL**: a conexão vive numa store de voz e a rota é só `/servers/$serverId`, porque o logo volta ao Hub sem desconectar (F6). A transmissão assistida vai em `?watch=<userId>`.
- Modais por **search param**: `?settings=<seção>` no layout logado (vale no Hub e no servidor) e `?serverSettings=<seção>` na rota do servidor. Voltar do browser fecha o modal e o refresh mantém aberto.
- Abas do painel admin como **rotas filhas** (`/admin/users`, `/admin/servers`...).

## Ferramentas a instalar

Dependências:
- `@tanstack/react-router`: rotas por arquivo, `beforeLoad` para auth, `validateSearch` com zod.
- `@tanstack/react-query`: estado de servidor. Eventos do socket só invalidam queries ou atualizam a store; o REST continua a fonte dos dados.
- `axios`: client REST em `shared/lib/http.ts` (`baseURL: '/api'`, `withCredentials`), com interceptor que converte o erro para o contrato de `packages/contracts/src/http/error.ts`.
- `zustand`: estado de cliente (voz, transmissão, preferências locais).
- `socket.io-client` (^4.8, igual à API): tipado com `ClientToServerEvents` e `ServerToClientEvents` do contracts.
- `better-auth` (^1.7.12, igual à API): `createAuthClient` de `better-auth/react` com `usernameClient`, `twoFactorClient` e `adminClient`, para sign-in, sign-up, 2FA, change-password, update-user e sign-out. O resto do REST vai pelo Axios.

DevDependencies:
- `@tanstack/router-plugin`: plugin do Vite que gera a árvore de rotas.
- `@tanstack/react-router-devtools` e `@tanstack/react-query-devtools`: só em dev.
- `@testing-library/react` + `jsdom`: projeto `unit` no Vitest para ViewModels (`renderHook`), rules e stores. Hoje só existe o projeto `storybook`.

Depois, em tickets próprios: `eslint-plugin-boundaries` via `jsPlugins` do oxlint (FE-13), `@sentry/react` (FE-13, precisa de DSN), Cypress com peer bot (FE-14).

## Organização

```
src/
├── main.tsx                      # só importa i18n, css e monta <App /> de app/
├── app/
│   ├── app.tsx                   # providers (QueryClient, I18n, Tooltip, Toaster, tema) + RouterProvider
│   ├── router.tsx                # createRouter, context { queryClient, auth }, declare module Register
│   ├── route-tree.gen.ts         # gerado pelo plugin (commitado, ignorado no oxlint/oxfmt)
│   └── routes/
│       ├── __root.tsx            # createRootRouteWithContext, ErrorBoundary, ConnectionBanner, BrowserSupportAlert
│       ├── _guest.tsx            # beforeLoad: com sessão vai para /; layout AuthLayout
│       ├── _guest/sign-in.tsx    # ?step=two-factor|recovery-code, ?redirect
│       ├── _guest/sign-up.tsx    # ?invite=<code> (vindo do F3)
│       ├── i.$code.tsx           # F3, funciona com e sem sessão (link https://.../i/JH34SD32)
│       ├── _authed.tsx           # beforeLoad: sem sessão vai para /sign-in?redirect; conecta o socket; ?settings=
│       ├── _authed/index.tsx     # Hub (/)
│       ├── _authed/servers.$serverId.tsx   # tela do servidor; ?serverSettings=, ?watch=
│       ├── _authed/admin.tsx     # beforeLoad: role admin; sem 2FA ativo vai para /admin/setup
│       ├── _authed/admin/setup.tsx         # QR + códigos de recuperação (fora do layout de abas)
│       ├── _authed/admin/_panel.tsx        # AdminLayout com as abas
│       ├── _authed/admin/_panel/index.tsx  # redirect para users
│       └── _authed/admin/_panel/{users,servers,hardware,limits,keys}.tsx
├── modules/<módulo>/
│   ├── model/                    # entities, rules, *.schema.ts, *.search.ts, services, mappers
│   ├── view-models/              # use-xxx.view-model.ts (+ .spec.ts), stores/
│   ├── views/                    # já existem
│   └── screens/                  # xxx.screen.tsx
└── shared/
    ├── lib/                      # http.ts, query-client.ts, socket.ts, auth-client.ts, form.ts (já existe)
    └── media/                    # MediaTransport + MeshTransport (FE-09)
```

## Regras

- Arquivo de rota só declara `validateSearch`, `beforeLoad`, `loader` (prefetch via `queryClient.ensureQueryData`) e `component: XxxScreen`. Nada de JSX além disso.
- Screen é cola fina: chama o ViewModel e passa o resultado para a View.
- Views continuam sem `Link` e `useNavigate`: a navegação chega como callback do ViewModel. Assim o Storybook não precisa de router e as stories atuais não mudam.
- Schemas de search ficam em `modules/<módulo>/model/*.search.ts` (ex.: `sign-in.search.ts` com `step`), usados pela rota e pelo ViewModel.
- Sessão: `auth` no context do router, carregada uma vez via query `['session']` (`authClient.getSession`), usada pelos `beforeLoad`. Sign-out e `session:revoked` limpam o QueryClient.
- Query keys por módulo em `model/services/*.keys.ts`, para os handlers do socket invalidarem sem conhecer as telas.
- Vite em dev faz proxy de `/api` e `/socket.io` (`ws: true`) para `http://localhost:3333`, igual ao nginx em produção, para os cookies do Better Auth funcionarem sem CORS.

## Ordem

Ver o grafo em `tickets/README.md`. Resumo: FE-01 (fundação) libera auth (FE-02) e socket (FE-05). Hub, convite, servidor e configurações vêm depois; voz e transmissão por último, porque dependem da tela do servidor e do socket.
