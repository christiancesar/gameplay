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
- [ ] Métricas e logs
- [ ] Specs
- [ ] Conferido no Grafana com duas abas numa sala
- [ ] Commit

## Critério de aceite
Com duas pessoas numa sala e uma transmitindo, o Grafana mostra 2 sockets, 2 em sala, 1 transmissão, 1 espectador, e os logs de entrada e saída aparecem no Loki.
