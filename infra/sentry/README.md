# Sentry

O que o Gameplay manda ao Sentry, e como montar o painel de qualidade de chamada que hoje vive no Grafana (`infra/grafana/dashboards/media.json`, alimentado pelo Faro).

## Projetos

| Projeto | Quem envia | Como o DSN chega |
|---|---|---|
| o do web (`gameplay-project-sentry`) | o navegador, pelo tunnel `/monitoring/sentry` do nginx | `VITE_SENTRY_DSN` em `infra/self-hosted/.env.web` (e `infra/production/.env`) |
| o do Electron | o app desktop: a janela, direto ao Sentry, e o main process | `VITE_SENTRY_DSN` em `apps/desktop/.env` |

Todo evento, log e métrica leva a tag (ou atributo) `app`: `web` ou `desktop`. O `environment` diz onde rodou (`development`, `production`, `host`) e não carrega o app. Para ver o desktop em produção: `environment:production app:desktop`.

## O que chega

| O quê | Web | Desktop (janela) | Desktop (main) |
|---|---|---|---|
| Erros (com Replay no erro) | sim | sim | sim, e crash nativo (minidump) |
| Traces (10% das cargas de página e navegações, nomeadas pela rota, e das chamadas `/api`) | sim | sim | não |
| Logs | `telemetry.log` | `telemetry.log` | o `main.log` de `info` para cima |
| Métricas | `webrtc.*` e `screen_share_start.*` | idem | não |

As chamadas `/api` levam os cabeçalhos `sentry-trace` e `baggage`, e `traceparent` quando o Faro está desligado, então a API (OTel, no Grafana Tempo) continua o trace do navegador.

## Métricas de chamada

Cada amostra de WebRTC (a cada 30 s por conexão) vira uma distribuição por valor, com os atributos `connection` (`relay` ou `direct`) e `app`. Os nomes que o Faro usava, no Loki, e os do Sentry:

| Painel do Grafana | Métrica no Sentry |
|---|---|
| Round trip p95 | `webrtc.rtt_ms` (p95) |
| Voice jitter p95 | `webrtc.audio_jitter_ms` (p95) |
| Voice loss | `webrtc.audio_loss_ratio` (média) |
| Screen fps received | `webrtc.screen_in_fps` (média) |
| Screen fps sent | `webrtc.screen_out_fps` (média) |
| Readings through TURN | contagem de `webrtc.rtt_ms` com `connection:relay` sobre o total |
| Connections by path | contagem de `webrtc.rtt_ms` agrupada por `connection` |
| Início de transmissão | `screen_share_start.audio_requested` e `screen_share_start.audio_received`, por `source`, `surface`, `browser` e `os` |
| LCP, INP e CLS p75 | Web Vitals das cargas de página (Performance > Web Vitals), já coletados pelo tracing |

## Montar o painel

No Sentry da organização: Dashboards > Create Dashboard > Add Widget, fonte **Metrics** (ou **Explore > Metrics**):

1. Linha "Calls": `p95(webrtc.rtt_ms)`, `avg(webrtc.audio_loss_ratio)`, `avg(webrtc.screen_in_fps)` e a contagem por `connection`.
2. Linha "Voice and screen": as mesmas séries agrupadas por `connection`, mais `webrtc.screen_out_fps`.
3. Filtros do topo: `environment` e `app`.

Os painéis ficam na interface do Sentry (a API de dashboards pede um token com permissões que o token de organização do build não tem), por isso este arquivo guarda a receita e não o JSON.

## Trocar o Faro de vez

O web ainda manda ao Faro e ao Sentry ao mesmo tempo (o `CompositeTelemetry`), para comparar os números lado a lado. Quando o painel acima bater com o do Grafana por alguns dias:

1. Esvazie `FARO_COLLECTOR_URL` em `infra/self-hosted/.env.web` (e em `infra/production/.env`) e rebuilde o web (`npm run host:start`). O Faro sai do build; o Sentry passa a mandar o `traceparent` sozinho.
2. Arquive `infra/grafana/dashboards/media.json` e a linha do Faro em `infra/grafana/README.md`.
3. Se quiser tirar o resto: o location `/monitoring/faro` do `nginx.conf` e o `FaroTelemetry` (`packages/client/src/shared/lib/telemetry/faro/`). O provedor pode ficar no código, desligado, para voltar um dia.
