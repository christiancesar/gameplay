# 02 · Tech Plan: fronteiras do `realtime` na API

> Data: 2026-10-28. Base: `00-requirements.md` e `01-epic-brief.md`. Tickets em `tickets/`.

## 1. Hoje

```
modules/realtime/
├── gateways/realtime.gateway.ts       13 handlers (conexão, servidor, salas, voz, stream, uso, sinal)
├── use-cases/
│   ├── connect-socket, disconnect-socket, subscribe-to-server     transporte e presença
│   ├── join-room, leave-room, update-voice-state, release-voice-seats   voz
│   ├── relay-to-peer                                                    sinalização mesh
│   ├── report-media-usage, apply-media-change                           mídia
├── stores/   presence, room-state, sfu-session
├── domain/   seat, sfu-session, socket-data, socket-rooms
├── providers/ realtime-emitter, realtime-metrics, socket-session-resolver, timers
└── listeners/domain-events.listener.ts

Imports de fora para dentro do realtime:
  media           -> realtime/stores (sfu-session, room-state), realtime/domain (seat, sfu-session), realtime/errors
  platform-admin  -> realtime/stores/presence
```

## 2. Alvo

```
common/
└── realtime/
    └── realtime-emitter.ts        porta: emitir para usuário, sala, servidor (implementada pelo realtime)

modules/
├── realtime/                      endpoint do socket
│   ├── gateways/realtime.gateway.ts   handlers finos: payload validado -> use case do provedor
│   ├── use-cases/connect-socket, disconnect-socket, subscribe-to-server
│   ├── providers/socket-io-emitter (implementa a porta), realtime-metrics, socket-session-resolver
│   ├── domain/socket-data, socket-rooms
│   └── listeners/domain-events.listener.ts   eventos de domínio -> emissor
├── presence/                      quem está online
│   ├── stores/presence.store (+ in-memory)
│   └── use-cases/                 marcar online e offline, listar (usado pelo platform-admin)
├── voice/                         salas de voz
│   ├── domain/seat
│   ├── stores/room-state.store (+ in-memory)
│   └── use-cases/join-room, leave-room, update-voice-state, release-voice-seats
├── signaling/                     sinalização mesh entre pares
│   └── use-cases/relay-to-peer
├── media/                         SFU, recursos, orçamento, consumo
│   ├── domain/sfu-session
│   ├── stores/sfu-session.store (+ in-memory)
│   ├── use-cases/ ... + report-media-usage, apply-media-change
│   └── services/cloudflare-usage.service    (hoje realtime-usage.service)
└── ice/                           sem mudança
```

## 3. Regras

- **Direção**: `realtime` importa `presence`, `voice`, `signaling` e `media`. Nenhum deles importa `realtime`. Entre provedores, só pela interface pública do módulo (o que o `*.module.ts` exporta), sem importar `stores/` ou `domain/` de outro módulo por caminho interno.
- **Avisar os clientes**: o provedor recebe a porta `RealtimeEmitter` de `common/realtime/` por injeção. O `realtime` registra a implementação Socket.IO como provider global. Para "algo aconteceu" que mais de um módulo ouve, continua o barramento de eventos de domínio (`common/events`).
- **Desconexão**: o `disconnect-socket` do `realtime` orquestra a limpeza chamando os provedores na ordem de hoje (sinalização, SFU, voz, presença). Nenhum provedor sabe que existe socket.
- **Gateway**: cada handler valida o payload (zod do `contracts`, como hoje), monta quem é o usuário (`who(socket)`) e chama um use case. Sem regra no gateway.
- **Lint**: `no-restricted-imports` no `oxlint` da API proibindo `**/modules/realtime/**` fora de `modules/realtime/`, e caminhos internos (`/stores/`, `/domain/`) de outro módulo.
- **Testes**: os specs e os contextos de teste (`test/<módulo>-context.ts`, seed, fakes) mudam junto com o código, um fake por arquivo como hoje.

## 4. Decisões em aberto

- **Configurações de mídia no `limits`** (`media-settings.repository`, `effective-media.service`): mover para o `media` ou manter no `limits` como dono de toda configuração com override. Proposta: manter no `limits` e registrar a regra; fora deste épico.
- **Nome do serviço de consumo**: `CloudflareUsageService` (proposta) ou `CallsUsageService`.
