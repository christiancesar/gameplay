# OBS-03 · Métricas e logs do realtime na API

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: OBS-01 · Onda 2

## Contexto
O gateway Socket.IO não gera métricas e só registra log de erro. Não dá para ver no Grafana quantas pessoas estão conectadas, quantas caem, quem está em sala ou transmitindo.

## Escopo
- Métricas OTel (`@opentelemetry/api`, meter `gameplay-realtime`), sem `userId`, `serverId` ou `roomId` nos atributos (plano free com 10k séries):
  - gauges observáveis: sockets conectados, usuários online, pessoas em sala de voz, transmissões ativas, espectadores;
  - contadores: conexões, desconexões por `reason` do Socket.IO, falhas de autenticação no handshake, erros por evento;
  - histograma: duração de cada handler por nome do evento.
- Logs `info` estruturados (pino) para conectar, desconectar (com motivo), entrar e sair de sala, começar e parar transmissão, com `userId`, `serverId` e `roomId`.
- Os números vêm de `PresenceStore` e `RoomStateStore`, sem estado novo.
- Specs com fakes do meter, seguindo o padrão de contexto e seed do módulo.

## Fora do escopo
Qualidade de mídia (vem do browser, OBS-04). Dashboards (OBS-05).

## Checklist
- [x] Métricas e logs
- [x] Specs
- [ ] Conferido no Grafana com duas abas numa sala
- [x] Commit

## Critério de aceite
Com duas pessoas numa sala e uma transmitindo, o Grafana mostra 2 sockets, 2 em sala, 1 transmissão, 1 espectador, e os logs de entrada e saída aparecem no Loki.

## Notas da execução (2026-10-26)

- `RealtimeMetrics` (abstract) e `OtelRealtimeMetrics` no meter global (`gameplay-realtime`), sem efeito quando o OTel está desligado. Nomes no Prometheus:
  - `gameplay_realtime_sockets` (abertos), `gameplay_realtime_connections_total`, `gameplay_realtime_disconnections_total` por `socket_io_disconnect_reason`, `gameplay_realtime_handshake_rejected_total`;
  - gauges `gameplay_realtime_users_online`, `gameplay_voice_participants` (inclui quem espera reconexão) e `gameplay_voice_streams`, lidos do `PresenceStore` e do `RoomStateStore` (`stats()` novo no store) a cada exportação;
  - histograma `gameplay_realtime_handler_duration_seconds` por `socket_io_event` e `outcome`, com `error_type` (código do `DomainError`, ou nome da classe) nas falhas. Um interceptor no gateway mede todos os handlers.
- Motivo da desconexão: o hook do Nest não repassa, então o gateway escuta o `disconnect` do Socket.IO na conexão.
- Logs `info`: `Socket connected`, `Socket disconnected` (com motivo), `Joined voice room`, `Left voice room` (motivo `left`, `removed` ou `room-deleted`), `Voice seat expired without a reconnection`, `Screen share started` e `stopped` (com preset). Mute e deafen não geram log (ruído).
- Métricas de runtime do Node (`@opentelemetry/instrumentation-runtime-node` 0.35, a linha compatível com o OTel 0.222 do projeto): event loop, GC e heap.
- Nos specs da API, o `vitest.setup.ts` desliga a saída do Logger do Nest.
- Conferido no host pelo Prometheus: sockets, conexões, handshake recusado, usuários online, participantes, transmissões e as métricas `nodejs_*` e `v8js_*`.

Suposições:
- O servidor não sabe quem assiste quem (o pedido de assistir só é repassado a quem transmite), então não há gauge de espectadores; os pedidos aparecem como contagem de `stream:watch` no histograma dos handlers. Espectadores ao vivo podem vir do Faro (OBS-04). *(suposição)*
- `gameplay_voice_participants` conta lugares guardados para reconexão (até 30 s). *(suposição)*
