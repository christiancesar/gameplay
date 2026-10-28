# 01 · Epic Brief: fronteiras do `realtime` na API

> Data: 2026-10-28. Base: `00-requirements.md`.

## Resumo

Hoje o `realtime` mistura o endpoint do socket com regras de voz, sinalização, presença e mídia, e o `media` importa o estado interno do `realtime`. Este épico separa as responsabilidades: o `realtime` vira só a camada do socket e cada recurso vira um provedor com fronteira clara.

## Contexto e problema

Levantado em 2026-10-28:
- O estado do SFU (`sfu-session.store`, `domain/sfu-session`) mora no `realtime`, e o `media` importa esse estado e o `room-state.store` em 6 arquivos.
- Regras de mídia moram no `realtime` porque chegam pelo socket: `report-media-usage` e `apply-media-change`.
- O `platform-admin` importa o `presence.store` de dentro do `realtime`.
- "Realtime" tem dois sentidos: o módulo do socket e o produto Cloudflare Realtime (`RealtimeUsageService` no `media`).
- Quem lê o código não sabe onde termina o transporte e onde começa a regra.

## O que entrega

- `realtime` só com gateway, conexão, autenticação do socket, salas do Socket.IO e o emissor.
- Módulos provedores: `presence`, `voice`, `signaling`, e o `media` dono de tudo do SFU e do consumo.
- Porta de emissão em `common/`, implementada pelo `realtime`.
- Regra de lint impedindo que outro módulo importe o `realtime`.

## Critério de sucesso

- Nenhum import de `modules/realtime` fora do próprio `realtime` (lint verde).
- Mesmos testes passando (contagem igual ou maior) e AsyncAPI sem diferença.
- Gateway com handlers finos: validam o payload e chamam um use case de um provedor.

## Riscos

- **Desconexão**: hoje ela limpa voz, sinalização e SFU juntos. Ao separar, a ordem da limpeza precisa continuar a mesma.
- **Volume de arquivos movidos**: conflito com trabalho em paralelo no `realtime` ou no `media`. Fazer em tickets curtos, um por provedor.
