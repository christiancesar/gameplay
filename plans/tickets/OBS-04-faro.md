# OBS-04 · Grafana Faro no web

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: OBS-01, OBS-02 · Onda 2

## Contexto
Decisão do usuário em 2026-10-26: adicionar o Faro (Frontend Observability do Grafana Cloud). Ele leva Web Vitals, sessões e traces do browser para o mesmo Grafana da API, ligando o clique no front ao trace da API. A qualidade de mídia só existe no browser (`getStats`) e vai pelo Faro.

## Escopo
- App de Frontend Observability no Grafana Cloud, URL do coletor em `VITE_FARO_URL`. Desligado sem ela, como o Sentry.
- `@grafana/faro-web-sdk` e `@grafana/faro-web-tracing` em `shared/lib/faro.ts`: Web Vitals, sessão, eventos de navegação do TanStack Router, `traceparent` só para `/api` (o mesmo domínio).
- Erros **não** vão para o Faro (ficam no Sentry): desligar a captura de erros e de console do Faro.
- Qualidade de mídia: a cada 30 s numa call e um resumo ao sair, medidas por tipo (`voice`, `screen`) e papel (`sender`, `receiver`): perda de pacotes, jitter, RTT, bitrate, fps, resolução e tipo de conexão (direta ou relay). Agregação numa regra pura do Model, envio pelo wrapper `shared/lib/monitoring.ts` (ViewModels nunca importam o Faro).
- Usuário: só o id, igual ao Sentry.
- Build arg no compose e no Dockerfile; README do host.

## Fora do escopo
Erros (OBS-02). Métricas da API (OBS-03). Dashboards (OBS-05).

## Checklist
- [ ] Faro desligado sem URL
- [ ] Web Vitals e navegação no Grafana
- [ ] Trace do browser ligado ao trace da API no Tempo
- [ ] Medidas de mídia de uma call real
- [ ] Specs da regra de agregação
- [ ] Commit

## Critério de aceite
Uma call de dois minutos no host gera medidas de voz e de tela no Grafana, e uma requisição do web aparece no Tempo com o span do browser como pai do span da API.
