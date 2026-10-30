# BE-04 · Autenticação com Better Auth (username, admin, 2FA)

> Pontos: 8 · Modelo sugerido: Opus para o desenho dos guards e hooks, Sonnet para o resto · Depende de: BE-03 · Onda 4 · **Status: concluído em 2026-10-24**

## Contexto
O Better Auth fica integrado ao Nest pelo `@thallesp/nestjs-better-auth`, com `prismaAdapter` (postgresql). Plugins: `username` (login por email ou username), `admin` (papel de plataforma, suspensão, sessões) e `twoFactor` (TOTP obrigatório para o admin da plataforma). A sessão vai em cookie no mesmo domínio, então não há CORS.

## Escopo
- `src/lib/auth.ts`:
  - instância com os três plugins e `bodyParser: false` no `main.ts`;
  - `trustedOrigins`, e IP pelo `X-Forwarded-For` com `trust proxy` restrito;
  - tabelas do Better Auth no `prisma/schema/auth.prisma`, mais os campos do app no `User` (`avatarKey`, `theme`, `locale`, `maxServersOverride`); migration.
- Regras do username: 3 a 32 caracteres, letras, números, `.`, `-` e `_` (schema no `packages/contracts`).
- Pontos de extensão do sign-up, implementados nos tickets seguintes:
  - hook `before` que exige o campo `registrationKey` (consumido no BE-05);
  - hook `after` que dispara a criação do pedido de entrada quando vier `serverInviteCode` (BE-10).
- `common`: `@CurrentUser()`, `AuthGuard` (sessão obrigatória por padrão, `@Public()` para exceções) e `@PlatformAdmin()` (`role = admin` **e** `twoFactorEnabled`, checados a cada requisição).
- Seed do admin da plataforma por script (`npm run seed:admin`), lendo email, username e senha do env. O primeiro login exige configurar o TOTP antes de qualquer rota de admin.
- Rate limit de login e sign-up mais rígido que o global.
- Usuário suspenso (`banned`) não loga e perde as sessões (comportamento do plugin; testar).
- Schemas do sign-up e do login no `packages/contracts`, para o web reaproveitar.

## Fora do escopo
Consumo da key (BE-05), pedido de entrada (BE-10), telas do painel (BE-15), desconexão do socket na suspensão (BE-11).

## Referências
- `plans/[complete]-core-product/00-requirements.md` 2.1 e 2.10
- `plans/[complete]-backend/04-tech-plan.md` seção 1 (auth)
- `plans/[complete]-core-product/02-core-flows.md` (SignIn, SignUp, 2FA)

## Checklist
- [x] Consultar docs atuais (Context7): Better Auth 1.x (plugins username, admin, twoFactor, prismaAdapter, hooks) e `@thallesp/nestjs-better-auth`
- [x] Instância e montagem no Nest, com `bodyParser: false`
- [x] Schema Prisma gerado pelo CLI do Better Auth, com os campos extras e migration
- [x] Guards e `@CurrentUser`, com testes
- [x] Seed do admin e fluxo de 2FA obrigatório
- [x] Rate limit de login e sign-up
- [x] E2E: sign-up (com o hook `before` ainda simulado), login por email e por username, logout, rota protegida sem sessão (401), rota de admin sem 2FA (403)
- [x] OpenAPI das rotas do Better Auth, se o adaptador expuser
- [x] Commit a cada passo verde

## Critério de aceite
Login por email ou username funciona com cookie. Rotas protegidas recusam sem sessão. Rotas de admin recusam sem 2FA. O admin semeado consegue configurar o TOTP e entrar.

## Notas da execução
- Better Auth 1.7 em `src/lib/auth.ts` (`createAuth`), montado pelo `AuthenticationModule` (`src/modules/auth`) com `AuthModule.forRootAsync` do `@thallesp/nestjs-better-auth`. Rotas em `/api/auth/*`; cookie com prefixo `gameplay`.
- **O guard global é o do adaptador**: toda rota exige sessão, exceto as marcadas com `@AllowAnonymous()` (do pacote). Não criei `AuthGuard`/`@Public` próprios. `@CurrentUser()` (nosso) devolve o usuário da sessão; `@PlatformAdmin()` combina `@Roles(['admin'])` com o `TwoFactorEnabledGuard`, que responde 403 `TWO_FACTOR_REQUIRED`.
- O papel de plataforma é `role = "admin"` do plugin `admin`, chamado de "admin da plataforma" nos documentos. Papéis dentro de um servidor ficam em `Membership.role`, fora do Better Auth.
- Schema gerado com a CLI nova (`npx auth generate --adapter prisma`) e salvo em `prisma/schema/auth.prisma`, com os campos do app no `User` (`avatarKey`, `theme`, `locale`, `maxServersOverride`). O `username` fica opcional no banco (formato do plugin); o hook de sign-up o exige.
- Hook `before` do sign-up (`SignUpHook`): exige `username` e `registrationKey` no formato do `packages/contracts` e usa o username como `name` (o Better Auth exige `name`). **O BE-05 liga aqui o consumo real da key.** O hook `after` do convite de servidor fica para o BE-10.
- `packages/contracts` ganhou `passwordSchema` (mínimo 8) e `registrationKeySchema` (6 caracteres do alfabeto sem ambíguos, sem diferença de maiúsculas).
- Rate limit do próprio Better Auth nas rotas de login, cadastro e 2FA (desligado em `NODE_ENV=test`). O throttler global continua valendo para o resto.
- IP da sessão vem do `X-Forwarded-For` (nginx/cloudflared). Atenção: acessando a API direto (porta exposta), esse cabeçalho pode ser forjado; em produção só o nginx fica exposto.
- Seed do admin: `npm run seed:admin` (dev) ou `node apps/api/dist/scripts/seed-admin` (container), com `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`. Se o email existe, só promove. O TOTP é configurado pelo próprio admin no primeiro login; até lá as rotas de admin recusam.
- Docs: o plugin `openAPI` do Better Auth entra só com as docs ligadas, e o Scalar ganhou a fonte "Auth (Better Auth)".
- As respostas de erro das rotas `/api/auth/*` seguem o formato do Better Auth (`{ code, message }`), não o nosso; o client do Better Auth no web trata esse formato.
- Prisma 7 não roda o `generate` depois do `migrate dev`; o script `db:migrate` agora faz os dois.
- `express` virou dependência direta da API: é peer do adaptador, e sem ela a imagem de produção não subia (o `turbo prune` não levava o `express` da raiz). Imagem: 494 MB; ~148 MB de RAM.
- **Rotas desligadas (decidido em 2026-10-24):** `disabledPaths` com a lista em `src/lib/auth-disabled-paths.ts`, mais um plugin pequeno para as rotas com parâmetro (`/reset-password/:token`, `/callback/:id`), que o `disabledPaths` não cobre por comparar o caminho exato. Respondem 404 por HTTP e somem da OpenAPI do Better Auth; chamadas pelo servidor (`auth.api.*`) continuam funcionando.
  - Todas as `/admin/*`: elas não exigem 2FA e não publicam eventos de domínio. O painel (BE-15) usa rotas próprias com `@PlatformAdmin()` que chamam o plugin pelo servidor. Isso inclui `admin/set-role`, porque admin só vem do seed.
  - Fluxos de email (verificação, esqueci a senha, troca de email), login social, exclusão da própria conta e OTP do 2FA (só TOTP).
  - Ficam ligadas `change-password` e `update-user`: o usuário troca a própria senha e o username. O Storybook precisa ser ajustado (ver PROGRESS).
  - E2e checa GET e POST em cada rota desligada, para uma rota GET não passar só por ter sido chamada com POST.
- **Avatar só por upload:** `UpdateUserHook` recusa `image` no `/update-user` (400 `IMAGE_UPLOAD_ONLY`). O campo `image` do Better Auth passa a guardar a URL pública do avatar, gravada só pelo endpoint de upload (BE-08). Assim o avatar chega em `session.user.image` sem chamada extra, e ninguém grava uma URL externa que pule a validação do upload.
