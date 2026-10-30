# BE-11 · Gateway Socket.IO: conexão autenticada, presença e avisos

> Pontos: 8 · Modelo sugerido: Opus para o desenho do estado, Sonnet para o resto · Depende de: BE-09 · Onda 7

## Contexto
O Socket.IO roda no mesmo processo, com o mesmo cookie de sessão. Ele não guarda nada no banco. Mantém na memória quem está online e quais servidores cada socket acompanha, e repassa para os sockets os eventos de domínio que os módulos REST publicam. O contrato tipado fica em `packages/contracts/src/realtime` (ver `04-tech-plan.md` seção 3).

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
- Contrato no `packages/contracts`: `ClientToServerEvents`, `ServerToClientEvents`, constantes de nome e schemas.
- Documentação AsyncAPI de todos os eventos deste ticket.
- Consulta de presença para o painel do admin (BE-15).

## Fora do escopo
Salas de voz, sinalização e transmissão (BE-12), notificações (BE-13).

## Referências
- `plans/[complete]-core-product/00-requirements.md` 3.3 e 3.3.1
- `plans/[complete]-backend/04-tech-plan.md` seções 1 e 3 (contrato, fluxos, modos de falha)

## Checklist
- [x] Consultar docs atuais (Context7): gateways do Nest 11, middleware de handshake, `nestjs-asyncapi` em gateways
- [x] Contrato tipado no `packages/contracts` e uso dos genéricos `Server<...>` no gateway
- [x] Handshake autenticado, com e2e (sem cookie é recusado)
- [x] `PresenceStore` com testes (várias abas, última aba fechada)
- [x] `server:subscribe` com checagem de membro
- [x] Ponte de eventos de domínio, com e2e (kick derruba a pessoa do servidor; suspensão desconecta)
- [x] AsyncAPI publicado
- [x] Commit a cada passo verde

## Critério de aceite
Dois clientes `socket.io-client` autenticados veem a presença um do outro. Um kick via REST chega como `server:removed` ao expulso, e uma suspensão desconecta a pessoa na hora.

## Notas da execução
- Módulo `src/modules/realtime`: `gateways/realtime.gateway.ts`, `listeners/domain-events.listener.ts` (ponte dos eventos de domínio), `providers/realtime-emitter.ts` (`RealtimeEmitter` abstrato e `SocketIoRealtimeEmitter`, que recebe o `Server` no `afterInit`), `providers/socket-session-resolver.ts` (sessão do Better Auth pelo cookie), `stores/presence.store.ts` com `InMemoryPresenceStore`, e os use-cases `ConnectSocket`, `DisconnectSocket` e `SubscribeToServer`. Testes unitários usam `makeRealtimeContext()` (`realtime/test/fakes.ts`) com `FakeRealtimeEmitter`.
- **Handshake:** middleware `server.use()` no `afterInit`, como a doc do Nest 11 recomenda (o `handleConnection` assíncrono não bloqueia mensagens). Sem sessão válida o cliente recebe `connect_error` com a mensagem `UNAUTHENTICATED`. Cada socket entra na sala `user:<id>`, para alcançar todas as abas da pessoa.
- **Erros no ack:** filtros globais não valem para gateways, então o gateway usa `@UseFilters(WsAckExceptionFilter)` (`common/errors`), que responde o ack com `{ ok: false, error }` no formato do BE-03. Validação com `@UsePipes(ZodValidationPipe)`.
- **Contrato** em `packages/contracts/src/realtime/events.ts`: `REALTIME_EVENTS`, schemas zod, `ClientToServerEvents` e `ServerToClientEvents`. Por enquanto só `server:subscribe`, `presence:snapshot`, `presence:update`, `server:changed`, `server:removed` e `session:revoked`; o BE-12 acrescenta salas de voz e sinalização.
- **AsyncAPI:** os eventos que a API emite estão documentados nos métodos do `SocketIoRealtimeEmitter`, marcado com `@AsyncApi()` (acrescentado ao `docs/asyncapi-decorators.ts`, com no-op na imagem de produção).
- **Ponte:** `server.updated`, `room.changed`, `membership.join-requested`, `declined`, `role-changed` e `approved` viram `server:changed` para a sala do servidor. `membership.removed` vira `server:removed` para a pessoa (e tira os sockets dela da sala) e `server:changed` para os outros. `server.deleted` vira `server:removed` para todos os membros. `user.suspended` e `user.sessions-revoked` (declarados agora em `domain-events.ts`, publicados pelo BE-15) viram `session:revoked` e desconectam todas as abas.
- `PresenceStore` exportado pelo `RealtimeModule` para o painel do admin (`isOnline`, `onlineAmong`, `onlineUserIds`).
- **Suposições minhas a confirmar:**
  - Presença é global: online é ter pelo menos uma aba conectada, não estar com o servidor aberto. Por isso o `presence:update` sai na conexão da primeira aba e no fechamento da última, para todos os servidores da pessoa, e não no `server:subscribe` como dizia o escopo. Sem tempo de tolerância na presença (os 30 s são da sala de voz); recarregar a página faz a pessoa piscar offline.
  - Um servidor acompanhado por socket: `server:subscribe` em outro servidor sai do anterior.
  - `server:removed` ganhou o motivo `left`, para as outras abas de quem saiu fecharem o servidor.
  - Membro aprovado que já está online recebe um `presence:update` na hora, porque não estava no snapshot dos outros.
  - `presence:snapshot` ainda sem `rooms`; entra no BE-12 junto com a ocupação das salas.
- **Para o web:** o Socket.IO fica em `/socket.io` sem o prefixo `/api`. Em dev, o Vite precisa de proxy de `/api` e `/socket.io` (com `ws: true`) para o cookie valer na mesma origem; hoje o gateway não configura CORS.
