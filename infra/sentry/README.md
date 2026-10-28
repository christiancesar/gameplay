# Sentry

O que o Gameplay manda ao Sentry, e como montar o painel de qualidade de chamada que hoje vive no Grafana (`infra/grafana/dashboards/media.json`, alimentado pelo Faro).

## Projetos

| Projeto | Quem envia | Como o DSN chega |
|---|---|---|
| o do web (`gameplay-project-sentry`) | o navegador, pelo tunnel `/monitoring/sentry` do nginx | `VITE_SENTRY_DSN` em `infra/self-hosted/.env.web` (e `infra/production/.env`) |
| o do Electron (`gameplay-electron`) | o app desktop: o main process envia ao Sentry, e a janela manda o que vê **pelo main** (IPC, como na documentação do Sentry para Electron) | `VITE_SENTRY_DSN` em `apps/desktop/.env` |

Todo evento, log e métrica leva a tag (ou atributo) `app`: `web` ou `desktop`. O `environment` diz onde rodou (`development`, `production`, `host`) e não carrega o app. Para ver o desktop em produção: `environment:production app:desktop`.

## O que chega

| O quê | Web | Desktop (janela) | Desktop (main) |
|---|---|---|---|
| Erros (com Replay no erro) | sim | sim | sim, e crash nativo (minidump) |
| Traces (10% das amostras) | cargas de página e navegações, nomeadas pela rota, e as chamadas `/api` | idem | a abertura do app (`startupTracingIntegration`) |
| Logs | `telemetry.log` | `telemetry.log` | o `main.log` de `info` para cima |
| Métricas | `webrtc.*` e `screen_share_start.*` | idem | `audio_share.linked` (o áudio de aplicativos ligou ou não, por modo) |

O SDK do Electron suportaria mais no main (spans de IPC, de rede e de arquivos). Por enquanto só entra o que responde a uma pergunta: a abertura do app e se o áudio de aplicativos ligou. Dá para acrescentar quando surgir a dúvida.

### Como a janela do desktop fala com o Sentry

Segue o guia do Sentry para Electron: o SDK da janela (`@sentry/electron/renderer`, em volta do `@sentry/react`) não envia nada pela rede. Eventos, escopo e breadcrumbs vão por IPC ao main, que junta o contexto de todos os processos e é quem fala com o Sentry (com fila em disco quando está offline). O bundle do main não consegue injetar o script de preload sozinho, então o `preload.ts` do app importa `@sentry/electron/preload`. A janela não leva o DSN. As duas pontas precisam estar na mesma versão do SDK (`@sentry/react` fica fixo em `11.8.0`, a que o `@sentry/electron` 8.3 exige).

### Crash nativo

O SDK ativa o `crashReporter` do Electron: um crash do main, da janela ou de um processo filho gera um minidump que sobe quando o app reabre (ou na hora, se foi a janela). Para os stack traces terem nomes de função e não endereços, ligue o servidor de símbolos do Electron: no Sentry, **Project Settings > Debug Files > Built-in Repositories > Electron** (no projeto `gameplay-electron`). Minidumps não são guardados pelo Sentry por padrão.

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

## Faro

O Faro está **desligado por configuração**: `FARO_COLLECTOR_URL` está vazio em `infra/self-hosted/.env.web` e em `infra/production/.env`, então o web não inicia o Faro e o Sentry manda o `traceparent` sozinho. Nada foi removido do código: o `FaroTelemetry`, o `create-faro-telemetry`, o tunnel `/monitoring/faro` do nginx e o dashboard `media.json` continuam no repositório.

Para voltar, preencha `FARO_COLLECTOR_URL` (a URL do coletor, no Grafana Cloud > Frontend Observability) e rebuilde o web (`npm run host:start`). Os dois destinos passam a receber ao mesmo tempo, e o Sentry deixa de mandar o `traceparent` para não duplicar o cabeçalho.

Peso: o código do Faro entra no bundle mesmo desligado, cerca de 210 kB a mais (67 kB comprimido). Se isso incomodar, dá para tirar o `create-faro-telemetry` do `create-telemetry.ts` e as dependências `@grafana/faro-*` sem mexer em mais nada.
