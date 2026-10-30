# BE-15 · Painel do admin da plataforma

> Pontos: 8 · Modelo sugerido: Sonnet · Depende de: BE-05, BE-06, BE-09, BE-11 · Onda 8

## Contexto
O admin da plataforma (`role = admin`) usa o mesmo app e o mesmo login, sempre com 2FA verificado. O painel lista usuários com status online, sessões com IP e user agent, e servidores com owner, membros e salas. Pelo painel ele também:
- suspende e reativa contas, derrubando sessões e conexões;
- encerra as sessões de um usuário;
- exclui qualquer servidor;
- redefine senhas;
- vê o hardware por usuário e o resumo da base.

As keys de cadastro e os limites já têm rotas próprias (BE-05 e BE-06).

## Escopo
Todas as rotas com `@PlatformAdmin()`. As rotas `/api/auth/admin/*` do Better Auth estão desligadas (BE-04): os use-cases chamam o plugin pelo servidor (`auth.api.banUser`, `auth.api.setUserPassword` etc.), assim valem o 2FA e os eventos de domínio:
- `ListUsers`, paginado com busca, com o status online do `PresenceStore`.
- `ListUserSessions` (IP e user agent do Better Auth) e `RevokeUserSessions`, que publica `user.sessions-revoked`.
- `SuspendUser` e `ReactivateUser`, pelo plugin `admin`. A suspensão publica `user.suspended`.
- `ResetUserPassword`, com senha digitada ou gerada, que o admin repassa por canal privado.
- `ListServers` (owner, contagem de membros e salas) e `GetServerDetail` (membros com o convite usado por cada um).
- `AdminDeleteServer`, reutilizando o `DeleteServer` do BE-09 sem a checagem de owner.
- `GetUserDevices` e `GetHardwareSummary`: menos núcleos, menos memória, % com aceleração, % com H.264 por hardware.

## Fora do escopo
Promover alguém a admin da plataforma (só por seed).

## Referências
- `plans/[complete]-core-product/00-requirements.md` 2.10 e 2.12
- `plans/[complete]-core-product/02-core-flows.md` (painel do admin)
- `plans/PROGRESS.md`, suposições (redefinição de senha)
- `plans/[complete]-backend/04-tech-plan.md` seção 3

## Checklist
- [x] Rotas de usuários e sessões, com e2e (inclusive 403 sem 2FA)
- [x] Suspender e reativar, com e2e: login bloqueado, socket desconectado e sessões derrubadas
- [x] Redefinir senha, com e2e (a senha antiga deixa de funcionar)
- [x] Servidores: listar, detalhar e excluir
- [x] Resumo de hardware, com teste da agregação
- [x] OpenAPI
- [x] Commit a cada passo verde

## Critério de aceite
Todas as ações de 2.10 funcionam só para admin com 2FA, e a suspensão derruba login, sessões e socket na mesma hora.

## Notas da execução
- Módulo `src/modules/platform-admin`, com três controllers (`admin/users`, `admin/servers`, `admin/hardware`), todos com `@PlatformAdmin()`.
- **Rotas:**
  - `GET /api/admin/users?search&page&pageSize` (mais novo primeiro, busca em username e email, com `online` do `PresenceStore` e `suspended`).
  - `GET /api/admin/users/:userId/sessions` (IP e user agent, só sessões ativas), `POST .../sessions/revoke`, `POST .../suspend`, `POST .../reactivate` (204).
  - `POST /api/admin/users/:userId/password` com `{ password? }`: sem senha, gera uma de 16 caracteres sem letras parecidas. Responde `{ password }` uma única vez.
  - `GET /api/admin/users/:userId/devices`.
  - `GET /api/admin/servers?search&page&pageSize` (owner, membros, salas), `GET /api/admin/servers/:serverId` (salas e membros com o convite de cada um), `DELETE /api/admin/servers/:serverId`.
  - `GET /api/admin/hardware/summary`.
- **Ações de conta pelo adapter interno do Better Auth** (`providers/auth-accounts.ts`, `AuthAccounts` com `BetterAuthAccounts`), e não por `auth.api.banUser` como dizia o escopo. As rotas do plugin `admin` exigem os headers da sessão do próprio admin; o adapter faz as mesmas gravações (o `banUser` do plugin é `updateUser` com `banned` mais `deleteUserSessions`) sem levar HTTP para os use-cases. O login de conta suspensa continua bloqueado pelo plugin.
- **Eventos:** suspender publica `user.suspended`; encerrar sessões e redefinir senha publicam `user.sessions-revoked`. O gateway fecha as abas e tira a pessoa da sala de voz na hora.
- **Excluir servidor:** reaproveita `DeleteServerUseCase.deleteById` sem autor, então o owner também recebe o aviso `server-deleted`.
- **Resumo de hardware:** função pura `domain/hardware-summary.ts`. Cada número considera só os dispositivos que informaram aquele dado; "H.264 por hardware" é `videoEncoding.h264.powerEfficient`. Percentuais com uma casa decimal.
- **Leituras próprias:** `AdminUsersRepository`, `AdminServersRepository` e `AdminDevicesRepository` (Prisma). Só o de usuários tem versão in-memory, usada pelos testes das ações; as listagens de servidores e o resumo são cobertos pelo e2e e pela função pura. `MembershipsModule` passou a exportar `MembershipsRepository`, e `AccountsModule` o `DeviceReportsRepository`.
- **Testes:** seed em `test/platform-admin-seed.ts`, fakes em arquivos próprios (`FakeAuthAccounts`, `FixedPasswordGenerator`) e montagem em `test/platform-admin-context.ts`. O teste do resumo monta os dispositivos com o `makeCollected` já existente.
- **Suposições minhas a confirmar:**
  - Redefinir a senha também encerra as sessões da pessoa.
  - O admin não pode suspender a própria conta (`CANNOT_SUSPEND_SELF`). Pode suspender outro admin.
  - Suspensão sem motivo e sem prazo (o plugin aceita os dois; a interface não pede).
  - Listas com 20 por página por padrão, até 100.
