# BE-12 · Salas de voz, sinalização WebRTC e estado da transmissão

> Pontos: 8 · Modelo sugerido: Opus · Depende de: BE-11 · Onda 8

## Contexto
A mídia é P2P em mesh, e o servidor só repassa mensagens. Cada pessoa está em uma sala por vez; entrar em outra troca direto. A voz vai para todos da sala. A tela só vai para quem pediu para assistir. O espectador pode pedir menos qualidade, e o streamer reduz só aquela conexão.

## Escopo
- `RoomStateStore` em memória: participantes por sala com `muted`, `deafened` e `streaming` (preset ou null).
- Eventos (contrato em `04-tech-plan.md` seção 3):
  - `room:join`: checa se a pessoa é membro do servidor da sala. Sai da sala anterior, inclusive se estava em outra aba *(suposição)*. Responde com os participantes no ack e emite `room:participants`.
  - `room:leave`, e saída automática no disconnect com tolerância de 10 s para reconexão *(suposição)*.
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
- [ ] `RoomStateStore` com testes (troca de sala, várias abas, tolerância de reconexão)
- [ ] `room:join` e `room:leave`, com e2e de dois e três clientes
- [ ] `signal:send` só entre participantes da mesma sala (e2e: tentativa entre salas diferentes é recusada)
- [ ] Estados de voz e de transmissão
- [ ] Eventos de assistir e de qualidade, só para o streamer
- [ ] Limpeza em exclusão e kick
- [ ] AsyncAPI atualizado
- [ ] Commit a cada passo verde

## Critério de aceite
Três clientes de teste entram na mesma sala, trocam sinais só entre si, veem mute e transmissão uns dos outros, e quem troca de sala some da anterior.
