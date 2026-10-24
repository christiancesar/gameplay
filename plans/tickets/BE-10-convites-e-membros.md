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
- `plans/00-requirements.md` 2.3, 2.4 e 2.5
- `plans/02-core-flows.md` (convite, landing do convite, entrar com código, pedidos, membros)
- `plans/04-tech-plan.md` seções 2 e 3

## Checklist
- [ ] Modelos e migration
- [ ] Gerador de código de 8 caracteres (reaproveitar o `TokenGenerator` do BE-05)
- [ ] Use-cases com testes unitários, cobrindo:
  - [ ] convite expirado, revogado e já usado
  - [ ] limite de membros na geração e na aprovação
  - [ ] auto aprovação com e sem vaga
  - [ ] pedido duplicado
  - [ ] kick e rebaixamento do owner proibidos
  - [ ] owner tentando sair
- [ ] Hook `after` do sign-up, com e2e: cadastro pelo link com convite válido e com convite expirado
- [ ] Rotas e e2e do fluxo completo: gerar, pedir, aprovar, promover, kick
- [ ] Eventos publicados
- [ ] Commit a cada passo verde

## Critério de aceite
Os fluxos de convite e moderação seguem 2.3 a 2.5, e todo caso de borda listado tem teste.
