# BE-06 · Limites e configurações da plataforma

> Pontos: 3 · Modelo sugerido: Haiku ou Sonnet · Depende de: BE-04 · Onda 5

## Contexto
Os limites têm padrão global editável pelo admin sem redeploy, com override por usuário ou por servidor:
- servidores criados por usuário: 1;
- membros por servidor: 10;
- salas por servidor: 2.

O limite efetivo é o override, quando existe, senão o padrão. A versão mínima do Chromium (exemplo: 130) também fica aqui.

## Escopo
- Modelo `PlatformSettings` (linha única `global`), criada pela migration ou pelo seed.
- Os campos de override (`User.maxServersOverride`, `Server.maxMembersOverride`, `Server.maxRoomsOverride`) ficam nos modelos donos. Aqui só o resolvedor e as rotas de edição.
- Use-cases: `GetPlatformSettings`, `UpdatePlatformSettings`, `ResolveEffectiveLimit(kind, ownerId)`, `SetUserLimitOverride`, `SetServerLimitOverride`.
- Rotas de admin para ler e editar as configurações e os overrides.
- Rota pública (sem sessão) que devolve só `minChromiumVersion`, para o alerta de browser no SignIn.

## Fora do escopo
Aplicar os limites na criação de servidor, convite e sala (BE-09 e BE-10 chamam o resolvedor).

## Referências
- `plans/00-requirements.md` 2.2, 2.10 e 2.13
- `plans/04-tech-plan.md` seção 2

## Checklist
- [x] Modelo, migration e valores padrão
- [x] Resolvedor com testes (com e sem override)
- [x] Rotas de admin e a rota pública, com OpenAPI
- [x] E2E: o admin altera um limite e o efetivo muda sem reiniciar
- [x] Commit

## Critério de aceite
Os limites efetivos mudam pelo painel sem redeploy, e os overrides têm precedência sobre o padrão.

## Notas da execução
- Módulo `src/modules/limits`. `PlatformSettings` com linha única `global`, criada pela migration (`INSERT` com os padrões do schema). O repositório usa `upsert`, então continua funcionando se a linha sumir (os e2e esvaziam o banco).
- Contrato em `packages/contracts/src/admin/platform-settings.ts`: `platformSettingsSchema` (limites com mínimo 1, `minChromiumVersion`), `publicSettingsSchema` e `userLimitsSchema` (`maxServers`: inteiro a partir de 0 ou `null` para voltar ao padrão). A View do Storybook usa `serversPerUser` e afins; o ViewModel faz o mapeamento.
- Rotas: `GET` e `PUT /api/admin/settings` (objeto completo), `PUT /api/admin/users/:userId/limits` (204; usuário inexistente responde 404 `USER_NOT_FOUND`) e `GET /api/settings/public` (sem sessão, só `minChromiumVersion`). As de admin usam `@PlatformAdmin()`.
- `ResolveEffectiveLimit` lê o banco a cada chamada (sem cache), por isso a mudança vale na hora. **Renomeado em 2026-10-24** para `EffectiveLimitsService.resolve()` em `limits/services/`: não é uma ação do usuário, e os use-cases dependem dele.
- **Ficou para o BE-09:** `Server` ainda não existe, então os tipos `membersPerServer` e `roomsPerServer` no resolvedor, o `SetServerLimitOverride` e a rota de override por servidor entram junto com o modelo `Server`. O resolvedor hoje aceita só `{ kind: 'serversPerUser', userId }`.
- `test/support/signed-in.ts`: helper dos e2e que cadastra um usuário com key real e devolve o agent com a sessão (com `admin` e `twoFactor` opcionais).

