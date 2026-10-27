# DESK-04 · Servidor em tempo de execução e autenticação por token

> Pontos: 5 · Depende de: DESK-03 · Branch `feature/desktop-runtime-server`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seção 4, itens 1, 2 e 5. No desktop a página vem de `app://` e a API de `https://`: o endereço do servidor é escolhido pelo usuário e o cookie de sessão não serve. O Better Auth client continua no renderer; só o token é guardado pelo main (DESK-06).

## Escopo
- **API**: plugin `bearer` do Better Auth (conferir a doc atual antes), CORS e `trustedOrigins` aceitando a origem do app desktop (`app://gameplay`), handshake do Socket.IO aceitando `Authorization: Bearer`.
- **Client**: `Platform.server` com `baseUrl()` e `session` (`getToken`, `setToken`, `clearToken`).
  - `http.ts`, `socket.ts` e `auth-client.ts` passam a usar `platform.server.baseUrl()`. No web continua o mesmo domínio.
  - Com token (desktop), `http`, Better Auth client e socket mandam `Authorization: Bearer`; o login grava o token pelo `setToken`, o logout apaga.
  - No web `session` é um no-op e tudo segue por cookie.
- Tunnels do Sentry e do Faro (`/monitoring/*`) montados a partir do `baseUrl()`.

## Fora do escopo
Onde o token fica guardado no desktop (DESK-06, `safeStorage`). Tela de escolha do servidor (DESK-05).

## Checklist
- [x] Plugin `bearer` na API, com e2e: login devolve token, request com Bearer autentica, 2FA e admin funcionam com Bearer
- [x] CORS e `trustedOrigins` para a origem do desktop, com e2e
- [x] Socket autenticando por Bearer, com e2e
- [x] `Platform.server` no client e `browserPlatform` (mesmo domínio, sem token)
- [x] `http`, socket e Better Auth client lendo a plataforma, specs com a `FakePlatform` em modo token
- [x] Sentry e Faro com `baseUrl()`
- [x] Commit a cada passo verde

## Checklist de validação
- [x] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes
- [x] E2E da API (`npm run test:e2e -w api`) verdes, incluindo os novos de Bearer, CORS e socket
- [x] Web: login, 2FA, voz e transmissão funcionando como antes por cookie (Cypress, 35 de 35)
- [x] `curl` com `Authorization: Bearer <token>` em `/api/auth/get-session` responde a sessão
- [x] Um request com `Origin: app://gameplay` recebe os headers de CORS; outra origem não

## Critério de aceite
O web funciona como antes por cookie, e a API autentica por Bearer qualquer cliente que mande o token, inclusive o socket.

## Notas da execução (2026-10-28)

O que foi feito:
- **API:** `bearer()` no Better Auth; `DESKTOP_APP_ORIGIN` (`app://gameplay`) e `socketAuthSchema` em `@gameplay/contracts`; a origem em `trustedOrigins`; CORS no `setupApp` para o WEB_ORIGIN e o desktop (métodos com PATCH, credenciais, `set-auth-token` exposto) com `disableTrustedOriginsCors` no módulo; o resolvedor do socket aceita `auth.token` do handshake; o gateway libera a origem do desktop no transporte por polling.
- **Client:** `Platform.server` (`baseUrl` e `session`); `http` com interceptor que lê o endereço e o token a cada request; `createSocket` com `auth` em função (token lido a cada tentativa); `authClient` com `customFetchImpl` (troca a origem), `auth: Bearer` e `onSuccess` (guarda o `set-auth-token`, apaga no sign-out); `onServer` para os tunnels do Sentry e do Faro, que passam a iniciar quando o `App` recebe a plataforma. `FakePlatform` com `baseUrl` e token.

Validação:
- Typecheck, lint, format e `npm test` verdes. API: 375 unitários e 164 e2e (17 arquivos) passando, com os novos de Bearer, CORS e socket. Client: 182 arquivos e 1264 testes (eram 178 e 1253).
- E2E novos da API: token no sign-up e no sign-in, request só com Bearer (`/auth-test/me` e `/auth/get-session`), token falso e ausente (401), admin com 2FA por token (200), preflight de `app://gameplay` com PATCH e `authorization` (204, com `allow-credentials`), outra origem sem CORS, polling do Socket.IO só para a origem do desktop, conexão do socket pelo token e recusa do falso.
- Cypress `npm run e2e`: 9 specs, 35 testes passando por cookie (admin 2FA, voz e transmissão incluídos).
- Simulação do desktop (página em `localhost:5173` com a plataforma apontando a API em `localhost:3333` e token em memória, arquivo temporário já removido): login pela UI, o token foi guardado e todas as chamadas seguintes (`get-session`, servers, notificações, limites, ice, devices) saíram com `Authorization: Bearer` e sem cookie, todas com 200.

Suposições:
- *(suposição)* `app://gameplay` é fixo e sempre confiável na API (uma constante no `contracts`, sem variável de ambiente). Uma página de browser não consegue forjar essa origem. O protocolo real é definido no DESK-05; se mudar, muda a constante.
- *(suposição)* CORS com `credentials: true` também para o desktop, por causa do cookie do desafio de 2FA (ver o risco na seção 8 do tech plan).
- *(suposição)* O gateway do Socket.IO só libera `app://gameplay`; o WEB_ORIGIN não, porque no web (e no Vite com proxy) a página e o socket têm a mesma origem. Na simulação do desktop o polling do Socket.IO foi bloqueado por CORS exatamente por isso (a página simulada tinha a origem do web, não `app://gameplay`); com a origem certa o e2e confirma que passa.
- *(suposição)* O `authClient` não ganhou tratamento de 401 que apague o token: com a sessão expirada o próximo `get-session` devolve vazio e o app cai no login.

Pendências levantadas (ficaram no tech plan, seção 8): o cookie do desafio de 2FA entre `app://` e `https://`, que só dá para validar com o Electron de verdade, e a propagação dos headers de trace do Faro entre origens.
