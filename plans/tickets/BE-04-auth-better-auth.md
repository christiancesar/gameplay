# BE-04 · Autenticação com Better Auth (username, admin, 2FA)

> Pontos: 8 · Modelo sugerido: Opus para o desenho dos guards e hooks, Sonnet para o resto · Depende de: BE-03 · Onda 4

## Contexto
O Better Auth fica integrado ao Nest pelo `@thallesp/nestjs-better-auth`, com `prismaAdapter` (postgresql). Plugins: `username` (login por email ou username), `admin` (papel de plataforma, suspensão, sessões) e `twoFactor` (TOTP obrigatório para o admin da plataforma). A sessão vai em cookie no mesmo domínio, então não há CORS.

## Escopo
- `src/lib/auth.ts`:
  - instância com os três plugins e `bodyParser: false` no `main.ts`;
  - `trustedOrigins`, e IP pelo `X-Forwarded-For` com `trust proxy` restrito;
  - tabelas do Better Auth no `prisma/schema/auth.prisma`, mais os campos do app no `User` (`avatarKey`, `theme`, `locale`, `maxServersOverride`); migration.
- Regras do username: 3 a 32 caracteres, letras, números, `.`, `-` e `_` (schema no `packages/shared`).
- Pontos de extensão do sign-up, implementados nos tickets seguintes:
  - hook `before` que exige o campo `registrationKey` (consumido no BE-05);
  - hook `after` que dispara a criação do pedido de entrada quando vier `serverInviteCode` (BE-10).
- `common`: `@CurrentUser()`, `AuthGuard` (sessão obrigatória por padrão, `@Public()` para exceções) e `PlatformAdminGuard` (`role = admin` **e** `twoFactorEnabled`, checados a cada requisição).
- Seed do admin da plataforma por script (`npm run seed:admin`), lendo email, username e senha do env. O primeiro login exige configurar o TOTP antes de qualquer rota de admin.
- Rate limit de login e sign-up mais rígido que o global.
- Usuário suspenso (`banned`) não loga e perde as sessões (comportamento do plugin; testar).
- Schemas do sign-up e do login no `packages/shared`, para o web reaproveitar.

## Fora do escopo
Consumo da key (BE-05), pedido de entrada (BE-10), telas do painel (BE-15), desconexão do socket na suspensão (BE-11).

## Referências
- `plans/00-requirements.md` 2.1 e 2.10
- `plans/04-tech-plan.md` seção 1 (auth)
- `plans/02-core-flows.md` (SignIn, SignUp, 2FA)

## Checklist
- [ ] Consultar docs atuais (Context7): Better Auth 1.x (plugins username, admin, twoFactor, prismaAdapter, hooks) e `@thallesp/nestjs-better-auth`
- [ ] Instância e montagem no Nest, com `bodyParser: false`
- [ ] Schema Prisma gerado pelo CLI do Better Auth, com os campos extras e migration
- [ ] Guards e `@CurrentUser`, com testes
- [ ] Seed do admin e fluxo de 2FA obrigatório
- [ ] Rate limit de login e sign-up
- [ ] E2E: sign-up (com o hook `before` ainda simulado), login por email e por username, logout, rota protegida sem sessão (401), rota de admin sem 2FA (403)
- [ ] OpenAPI das rotas do Better Auth, se o adaptador expuser
- [ ] Commit a cada passo verde

## Critério de aceite
Login por email ou username funciona com cookie. Rotas protegidas recusam sem sessão. Rotas de admin recusam sem 2FA. O admin semeado consegue configurar o TOTP e entrar.
