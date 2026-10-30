# BE-10 · Convites de servidor, pedidos de entrada e membros

> Pontos: 8 · Modelo sugerido: Sonnet · Depende de: BE-09 · Onda 7

## Contexto
- **Convite:** código de 8 caracteres, uso único, válido por 1 hora. É gerado e revogado por owner ou admin, e a geração fica bloqueada quando o servidor está no limite de membros. O convite é **consumido quando o pedido de entrada é criado**. Pedido recusado mantém o convite como usado.
- **Pedido de entrada:** é aprovado por owner ou admin. Com auto aprovação ligada, entra direto, exceto no limite de membros, quando fica pendente.
- **Moderação:** só kick, sem ban. Admin e member podem sair; o owner não.
- **Quem chega pelo link sem conta:** cadastra-se e o pedido nasce sozinho. Se o convite expirou nesse meio-tempo, a conta é criada e o Hub avisa.

## Escopo
- Modelos `ServerInvite` e `JoinRequest` e migration.
- Use-cases:
  - `CreateServerInvite` (permissão, limite de membros, validade de 1 h), `RevokeServerInvite` e `ListServerInvites` (quem criou, quem usou, quando e o status calculado: ativo, vencido, usado ou revogado; sem limpeza, tudo fica como registro);
  - `ResolveInviteCode`, público, para a landing do convite: nome e ícone do servidor e status do convite;
  - `RequestToJoin` (consome o convite numa transação; já membro ou pedido pendente dão erro; auto aprovação aplica quando há vaga);
  - `ApproveJoinRequest` (bloqueia no limite) e `DeclineJoinRequest`;
  - `ListJoinRequests` e `ListMembers` (com o convite usado por cada um);
  - `KickMember`, `PromoteToAdmin`, `DemoteToMember` e `LeaveServer`, todos com `ServerPermissions` e o owner intocável.
- Hook `after` do sign-up: com `serverInviteCode`, chama o `RequestToJoin`. Se o convite tiver expirado, publica o evento que vira a notificação `INVITE_EXPIRED`.
- Eventos de domínio: `membership.join-requested`, `approved`, `declined`, `removed` e `role-changed`.

## Fora do escopo
Avisar pelo socket e gravar as notificações (BE-11 e BE-13 escutam os eventos).

## Referências
- `plans/[complete]-core-product/00-requirements.md` 2.3, 2.4 e 2.5
- `plans/[complete]-core-product/02-core-flows.md` (convite, landing do convite, entrar com código, pedidos, membros)
- `plans/[complete]-backend/04-tech-plan.md` seções 2 e 3

## Checklist
- [x] Modelos e migration
- [x] Gerador de código de 8 caracteres (reaproveitar o `TokenGenerator` do BE-05)
- [x] Use-cases com testes unitários, cobrindo:
  - [x] convite expirado, revogado e já usado
  - [x] limite de membros na geração e na aprovação
  - [x] auto aprovação com e sem vaga
  - [x] pedido duplicado
  - [x] kick e rebaixamento do owner proibidos
  - [x] owner tentando sair
- [x] Hook `after` do sign-up, com e2e: cadastro pelo link com convite válido e com convite expirado
- [x] Rotas e e2e do fluxo completo: gerar, pedir, aprovar, promover, kick
- [x] Eventos publicados
- [x] Commit a cada passo verde

## Critério de aceite
Os fluxos de convite e moderação seguem 2.3 a 2.5, e todo caso de borda listado tem teste.

## Notas da execução
- **Um módulo só**, `src/modules/memberships`, em vez de `server-invites` e `memberships` separados como no tech plan: pedir entrada consome o convite e cria o pedido na mesma transação, e dividir obrigaria um módulo a escrever nas tabelas do outro.
- Modelos em `prisma/schema/membership.prisma`: `ServerInvite` e `JoinRequest` (`PENDING`, `APPROVED`, `DECLINED`). `ServerMember.inviteId` agora é relação com o convite. Tudo apaga em cascata com o servidor.
- **Concorrência:** `MembershipsRepository.withServerLock()` abre uma transação com a linha do servidor travada (`SELECT ... FOR UPDATE`) e entrega um `MembershipStore` com as leituras e escritas. Gerar convite, pedir entrada, aprovar, recusar, kick, promover, rebaixar e sair passam por ali, um servidor por vez. Isso garante o limite de membros e o pedido pendente único sem índice parcial no banco. As regras ficam nos use-cases.
- **Código:** 8 caracteres do mesmo alfabeto da key de cadastro (sem 0/O e 1/I), sem diferença de maiúsculas. Guardado em texto (vai no link e vale 1 hora). O gerador aleatório foi extraído para `common/crypto/random-code.ts` e é usado pelos dois.
- **Rotas:**
  - `POST`, `GET /api/servers/:serverId/invites` e `POST .../invites/:inviteId/revoke` (owner e admin). A lista traz status calculado (`active`, `expired`, `used`, `revoked`), quem criou e quem usou. Revogar de novo ou um vencido não dá erro; um usado dá 409 `SERVER_INVITE_USED`.
  - `GET /api/invites/:code` funciona com ou sem sessão (`@OptionalAuth`): status (com `not-found` para código inexistente, mal formado ou de servidor excluído), nome, ícone, contagem de membros, `full` e `alreadyMember`.
  - `POST /api/invites/:code/join` responde `{ serverId, result }`, com `result` `joined` (auto aprovação com vaga), `pending` ou `already-member` (quem já é membro só abre o servidor, e o convite continua livre).
  - `GET /api/servers/:serverId/join-requests` (só pendentes) e `POST .../join-requests/:requestId/approve` ou `/decline`.
  - `GET /api/servers/:serverId/members` (qualquer membro vê; owner primeiro, com o convite e quem convidou), `POST .../members/:targetId/kick`, `/promote`, `/demote` e `POST /api/servers/:serverId/leave`.
- **Erros:** `MEMBER_LIMIT_REACHED` (409), `SERVER_INVITE_NOT_FOUND` (404), `SERVER_INVITE_EXPIRED` e `SERVER_INVITE_REVOKED` (410), `SERVER_INVITE_USED` (409), `JOIN_REQUEST_PENDING` (409), `JOIN_REQUEST_NOT_FOUND` (404), `JOIN_REQUEST_DECIDED` (409), `MEMBER_NOT_FOUND` (404), `CANNOT_TARGET_SELF` (400, para kick, promover ou rebaixar a si mesmo), `OWNER_CANNOT_LEAVE` (403). Sem permissão continua `SERVER_PERMISSION_DENIED` (403).
- **Ordem das checagens ao pedir entrada:** já é membro, depois pedido pendente, depois o estado do convite. Assim um membro que abre um convite velho cai direto no servidor. Com o servidor cheio, o pedido fica pendente mesmo com auto aprovação.
- **Sign-up pelo link:** o corpo do `/sign-up/email` aceita `serverInviteCode` opcional. O hook `after` cria o pedido para a conta nova. Convite vencido nesse meio-tempo publica `server-invite.expired-on-sign-up` (`userId`, `serverId`, `serverName`), que o BE-13 transforma no aviso `INVITE_EXPIRED`. Convite usado, revogado ou de servidor excluído só vira log: a conta já existe e o cadastro não falha. *(Suposição minha: só o vencido vira aviso, como diz o ticket.)*
- **Eventos:** `membership.join-requested` (com `requestId`), `membership.approved` (`approvedById` nulo na auto aprovação), `membership.declined`, `membership.removed` (`kick` ou `leave`), `membership.role-changed` (`admin` ou `member`) e `server-invite.expired-on-sign-up`. Papéis em minúsculas, diferente do esboço do tech plan.
