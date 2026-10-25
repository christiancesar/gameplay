# BE-17 · Lacunas da API encontradas pelo frontend

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: BE-15 · Pedido do usuário em 2026-10-25

## Contexto
Ao ligar o Hub, a tela do servidor e o painel admin (FE-03, FE-06, FE-11), o web precisou de contornos porque a API não devolve alguns dados. O pior caso: no admin não existe GET dos limites próprios, então salvar o diálogo depois de recarregar a página apaga o limite que existia.

Fora da lista: entrar por convite com aprovação automática em servidor cheio já vira pedido pendente (`RequestToJoinUseCase`). É o comportamento planejado.

## Escopo
1. **Limite de servidores do usuário:** `GET /api/me/limits` com `{ maxServers, ownedServers }` (limite efetivo, já resolvido pelo `EffectiveLimitsService`).
2. **Limites próprios no admin:**
   - `AdminUser` ganha `maxServersOverride` (null = padrão), `effectiveMaxServers`, `ownedServerCount` e `sessionCount`.
   - `AdminServer` ganha `maxMembersOverride`, `maxRoomsOverride` (null = padrão), `effectiveMaxMembers` e `effectiveMaxRooms`.
3. **Encerrar uma sessão só:** `POST /api/admin/users/:userId/sessions/:sessionId/revoke`, com o mesmo efeito do encerrar todas, mas para uma sessão (derruba o socket daquela sessão com `session:revoked`).
4. **Última atividade da sessão:** `AdminSession` ganha `lastActiveAt` (o `updatedAt` da sessão do Better Auth).
5. **Contagem de pedidos pendentes:** o detalhe do servidor (`GET /api/servers/:id`) traz `pendingJoinRequests` para owner e admin do servidor, null para member.
6. **Listagem global de dispositivos:** `GET /api/admin/hardware/devices` paginado (mesmo `adminListQuerySchema`, busca por username), cada item com o usuário (`id`, `username`) e o relatório.

Contratos em `packages/contracts`, docs do Scalar atualizadas, testes unitários e e2e no padrão de `test/<módulo>-context.ts`, `test/<módulo>-seed.ts` e `test/factories/`.

## Fora do escopo
Mudanças no web (vão num passo seguinte, que remove os contornos do FE-03, FE-06 e FE-11).

## Checklist
- [ ] Contratos novos e alterados
- [ ] Rotas, use-cases e repositórios
- [ ] Unitários e e2e
- [ ] `typecheck`, `lint`, `format:check` e `test` verdes
- [ ] Commit
