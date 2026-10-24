# BE-11 · Gateway Socket.IO: conexão autenticada, presença e avisos

> Pontos: 8 · Modelo sugerido: Opus para o desenho do estado, Sonnet para o resto · Depende de: BE-09 · Onda 7

## Contexto
O Socket.IO roda no mesmo processo, com o mesmo cookie de sessão. Ele não guarda nada no banco. Mantém na memória quem está online e quais servidores cada socket acompanha, e repassa para os sockets os eventos de domínio que os módulos REST publicam. O contrato tipado fica em `packages/shared/src/realtime` (ver `04-tech-plan.md` seção 3).

## Escopo
- `@nestjs/websockets` e `@nestjs/platform-socket.io` 11.
- Middleware de handshake que valida a sessão do Better Auth pelo cookie, recusa a conexão sem sessão e põe o `userId` em `socket.data`.
- `PresenceStore` em memória (abstract class com implementação em memória, para trocar por Redis depois): usuário com N sockets, online e offline.
- `server:subscribe`: confere se a pessoa é membro, entra na sala Socket.IO `server:<id>` e recebe o `presence:snapshot`. Os outros recebem `presence:update`.
- Ponte de eventos de domínio:
  - `membership.*` e `room.changed` viram `server:changed`;
  - kick e `server.deleted` viram `server:removed` para a pessoa e tiram os sockets dela das salas;
  - `user.suspended` e `user.sessions-revoked` viram `session:revoked` e desconectam a pessoa.
- Validação dos payloads com os schemas zod e ack com erro no formato padrão (helper do BE-03).
- Contrato no `packages/shared`: `ClientToServerEvents`, `ServerToClientEvents`, constantes de nome e schemas.
- Documentação AsyncAPI de todos os eventos deste ticket.
- Consulta de presença para o painel do admin (BE-15).

## Fora do escopo
Salas de voz, sinalização e transmissão (BE-12), notificações (BE-13).

## Referências
- `plans/00-requirements.md` 3.3 e 3.3.1
- `plans/04-tech-plan.md` seções 1 e 3 (contrato, fluxos, modos de falha)

## Checklist
- [ ] Consultar docs atuais (Context7): gateways do Nest 11, middleware de handshake, `nestjs-asyncapi` em gateways
- [ ] Contrato tipado no `packages/shared` e uso dos genéricos `Server<...>` no gateway
- [ ] Handshake autenticado, com e2e (sem cookie é recusado)
- [ ] `PresenceStore` com testes (várias abas, última aba fechada)
- [ ] `server:subscribe` com checagem de membro
- [ ] Ponte de eventos de domínio, com e2e (kick derruba a pessoa do servidor; suspensão desconecta)
- [ ] AsyncAPI publicado
- [ ] Commit a cada passo verde

## Critério de aceite
Dois clientes `socket.io-client` autenticados veem a presença um do outro. Um kick via REST chega como `server:removed` ao expulso, e uma suspensão desconecta a pessoa na hora.
