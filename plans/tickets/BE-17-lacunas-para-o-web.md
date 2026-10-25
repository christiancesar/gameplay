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
- [x] Contratos novos e alterados
- [x] Rotas, use-cases e repositórios
- [x] Unitários e e2e
- [x] `typecheck`, `lint`, `format:check` e `test` verdes
- [x] Commit

## Notas da execução (2026-10-25)

Feito por um agente Sonnet; revisado pelo Opus. Commit `60cd48e` (um só, porque a mudança de contrato atravessa os seis itens) e `5b380dc` (tipo no e2e).

- `GET /api/me/limits` (`myLimitsSchema`, `contracts/account/limits.ts`), no módulo servers para evitar ciclo com limits.
- `AdminUser` e `AdminServer` com os limites próprios e efetivos e as contagens; contagens por group-by, sem N+1; `EffectiveLimitsService.defaults()` lido uma vez por página.
- `POST /api/admin/users/:userId/sessions/:sessionId/revoke`: evento `user.session-revoked`; cada socket entra na sala `session:<id>` e só aquela sessão recebe `session:revoked`.
- `AdminSession.lastActiveAt` (o `updatedAt` da sessão do Better Auth).
- `ServerDetail.pendingJoinRequests` (null para member), em toda rota que devolve o detalhe.
- `GET /api/admin/hardware/devices` paginado com busca por username.

Resultado: api 282 unitários e 148 e2e. No web, os contornos do FE-03, FE-06 e FE-11 foram trocados pelos dados novos (commits `3a7daaf`, `ad07e74`, `25d1d15`; apagados `server-limit.store.ts` e `limit-overrides.store.ts`).

Suposições *(confirmar)*:
- Encerrar uma sessão só não libera a vaga na sala de voz na hora: o socket cai e a vaga sai depois dos 30 s de reconexão. *(suposição)*
- `sessionCount` conta sessões não expiradas. *(suposição)*
- No diálogo de limite do admin, "padrão" é o padrão da plataforma (`/admin/settings`) e o valor próprio vem preenchido. *(suposição)*
- "Ativo agora" na sessão continua falso: `lastActiveAt` é o horário de renovação, não presença. *(suposição)*
- A aba de hardware mostra só a primeira página (100), porque a View não tem paginação nem busca. *(suposição)*
