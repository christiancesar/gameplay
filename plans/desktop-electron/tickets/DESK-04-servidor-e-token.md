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
- [ ] Plugin `bearer` na API, com e2e: login devolve token, request com Bearer autentica, 2FA e admin funcionam com Bearer
- [ ] CORS e `trustedOrigins` para a origem do desktop, com e2e
- [ ] Socket autenticando por Bearer, com e2e
- [ ] `Platform.server` no client e `browserPlatform` (mesmo domínio, sem token)
- [ ] `http`, socket e Better Auth client lendo a plataforma, specs com a `FakePlatform` em modo token
- [ ] Sentry e Faro com `baseUrl()`
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes
- [ ] E2E da API (`npm run test:e2e -w api`) verdes, incluindo os novos de Bearer, CORS e socket
- [ ] Web: login, 2FA, voz e transmissão funcionando como antes por cookie (manual)
- [ ] `curl` com `Authorization: Bearer <token>` em `/api/auth/get-session` responde a sessão
- [ ] Um request com `Origin: app://gameplay` recebe os headers de CORS; outra origem não

## Critério de aceite
O web funciona como antes por cookie, e a API autentica por Bearer qualquer cliente que mande o token, inclusive o socket.
