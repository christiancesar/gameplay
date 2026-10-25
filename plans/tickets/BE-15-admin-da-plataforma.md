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
- `plans/00-requirements.md` 2.10 e 2.12
- `plans/02-core-flows.md` (painel do admin)
- `plans/PROGRESS.md`, suposições (redefinição de senha)
- `plans/04-tech-plan.md` seção 3

## Checklist
- [ ] Rotas de usuários e sessões, com e2e (inclusive 403 sem 2FA)
- [ ] Suspender e reativar, com e2e: login bloqueado, socket desconectado e sessões derrubadas
- [ ] Redefinir senha, com e2e (a senha antiga deixa de funcionar)
- [ ] Servidores: listar, detalhar e excluir
- [ ] Resumo de hardware, com teste da agregação
- [ ] OpenAPI
- [ ] Commit a cada passo verde

## Critério de aceite
Todas as ações de 2.10 funcionam só para admin com 2FA, e a suspensão derruba login, sessões e socket na mesma hora.
