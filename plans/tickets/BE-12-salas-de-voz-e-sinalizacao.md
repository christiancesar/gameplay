# BE-12 · Salas de voz, sinalização WebRTC e estado da transmissão

> Pontos: 8 · Modelo sugerido: Opus · Depende de: BE-11 · Onda 8

## Contexto
A mídia é P2P em mesh, e o servidor só repassa mensagens. Cada pessoa está em uma sala por vez; entrar em outra troca direto. A voz vai para todos da sala. A tela só vai para quem pediu para assistir. O espectador pode pedir menos qualidade, e o streamer reduz só aquela conexão.

## Escopo
- `RoomStateStore` em memória: participantes por sala com `muted`, `deafened` e `streaming` (preset ou null).
- Eventos (contrato em `04-tech-plan.md` seção 3):
  - `room:join`: checa se a pessoa é membro do servidor da sala. Sai da sala anterior, inclusive se estava em outra aba *(suposição)*. Responde com os participantes no ack e emite `room:participants`.
  - `room:leave`, e saída automática no disconnect com tolerância de 30 s para reconexão *(decidido em 2026-10-24)*.
  - `voice:state`, que atualiza e repassa para a sala.
  - `stream:start` e `stream:stop`, que atualizam o estado e repassam.
  - `stream:watch`, `stream:unwatch` e `stream:quality`, repassados só para o streamer.
  - `signal:send`, repassado só para o destino, depois de checar que os dois estão na mesma sala.
- Limpeza do estado quando o servidor ou a sala é excluída, ou quando a pessoa é removida (escutando os eventos do BE-11).
- Estado da sala refletido no `presence:snapshot` (quem está em qual sala).
- AsyncAPI dos eventos.

## Fora do escopo
`MediaTransport` no web, TURN (BE-14), SFU.

## Referências
- `plans/00-requirements.md` 2.8, 2.9, 3.1, 3.1.1 e 3.3.1
- `plans/media-transport-options.md` seções 0 e 2.3
- `plans/02-core-flows.md` (sala, transmitir, assistir)
- `plans/04-tech-plan.md` seção 3 (fluxo "entrar na sala de voz")

## Checklist
- [x] `RoomStateStore` com testes (troca de sala, várias abas, tolerância de reconexão)
- [x] `room:join` e `room:leave`, com e2e de dois e três clientes
- [x] `signal:send` só entre participantes da mesma sala (e2e: tentativa entre salas diferentes é recusada)
- [x] Estados de voz e de transmissão
- [x] Eventos de assistir e de qualidade, só para o streamer
- [x] Limpeza em exclusão e kick
- [x] AsyncAPI atualizado
- [x] Commit a cada passo verde

## Critério de aceite
Três clientes de teste entram na mesma sala, trocam sinais só entre si, veem mute e transmissão uns dos outros, e quem troca de sala some da anterior.

## Notas da execução
- Tudo no módulo `realtime` do BE-11. Peças novas: `stores/room-state.store.ts` (`RoomStateStore` com `InMemoryRoomStateStore`), `domain/seat.ts` (regras puras do lugar na sala), `services/voice-rooms.service.ts` (`VoiceRoomsService`: lugar do socket, anúncio da sala, saída), `providers/timers.ts` (`Timers` com `NodeTimers`) e os use-cases `JoinRoom`, `LeaveRoom`, `UpdateVoiceState` (mute, deafen, início e fim da transmissão), `RelayToPeer` (sinal, assistir, deixar de assistir, qualidade) e `ReleaseVoiceSeats` (limpeza pelos eventos de domínio).
- **Um lugar por pessoa**, guardado com o socket que entrou. Só esse socket age sobre o lugar; outra aba recebe `NOT_IN_ROOM`. Entrar de outra aba move o lugar, e a aba antiga recebe `room:left` com `other-tab`.
- **Reconexão:** o socket que cai deixa o lugar esperando (`socketId` nulo) por `ROOM_RECONNECT_GRACE_MS` (30 s; 300 ms nos e2e). Voltar para a mesma sala nesse tempo mantém o lugar, a posição e a transmissão. Depois disso a pessoa sai e a sala é anunciada. Sinais para quem está esperando dão `PEER_NOT_IN_ROOM`.
- **Anúncio:** `room:participants` vai para quem acompanha o servidor e para a sala Socket.IO `voice:<roomId>`, onde fica o socket com o lugar. Assim quem está numa sala de voz continua vendo a própria sala com outro servidor aberto.
- **Limpeza:** sala excluída (`room-deleted`), kick ou saída do servidor (`removed`, só se o lugar for daquele servidor), servidor excluído (sem anunciar as salas) e suspensão ou sessões encerradas (sai na hora, sem esperar a reconexão).
- **Erros:** `ROOM_NOT_FOUND` (também para quem não é membro), `NOT_IN_ROOM`, `PEER_NOT_IN_ROOM` (outra sala, desconectado ou a própria pessoa) e `NOT_STREAMING` (assistir ou pedir qualidade de quem não transmite; deixar de assistir é aceito depois que a transmissão acabou).
- `RoomsRepository.findById()` acrescentado ao módulo `servers`.
- **Testes:** dados e factories separados, a pedido do usuário. `realtime/test/` tem um fake por arquivo (`FakeRealtimeEmitter`, `FakeTimers`), os dados iniciais em `realtime-seed.ts` e a montagem em `realtime-context.ts` (`makeRealtimeContext()`). Nos e2e, `test/factories/server.factory.ts` (`makeServer`, `createServerWithMembers`) e os helpers de socket em `test/support/socket-client.ts`.
- **Suposições minhas a confirmar:**
  - Todo evento do cliente tem ack, inclusive `signal:send`, `room:leave` e `stream:stop`, para o erro voltar no formato padrão. O tech plan tinha alguns sem ack.
  - `room:join` aceita `muted` e `deafened` iniciais, para quem entra mutado não aparecer sem mute por um instante.
  - Evento novo `room:left` (`other-tab`, `room-deleted`, `removed`), mandado só para o socket que perdeu o lugar sem pedir.
  - Trocar de sala zera a transmissão; voltar para a mesma sala a mantém.
  - `stream:start` com outro preset durante a transmissão só atualiza o preset.
  - A API não guarda quem assiste quem: o streamer controla as conexões, e quem sai da sala some pelo `room:participants`.
  - O seletor de qualidade do espectador (`stream:quality`) ficou no contrato, mas a decisão de ter isso no MVP ainda está pendente.
