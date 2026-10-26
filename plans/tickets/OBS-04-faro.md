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
- [x] Faro desligado sem URL
- [ ] Web Vitals e navegação no Grafana
- [ ] Trace do browser ligado ao trace da API no Tempo
- [ ] Medidas de mídia de uma call real
- [x] Specs da regra de agregação
- [x] Commit

## Critério de aceite
Uma call de dois minutos no host gera medidas de voz e de tela no Grafana, e uma requisição do web aparece no Tempo com o span do browser como pai do span da API.

## Notas da execução (2026-10-26)

- App `gameplay-web` (id 1688) criado pelo usuário no Frontend Observability, amostragem de 100%, sessão padrão, sem replay. Upload de source maps pulado: erros ficam no Sentry.
- `@grafana/faro-web-sdk` e `@grafana/faro-web-tracing` 2.13 (a versão web, não a `faro-react`: a integração de rotas dela é só para React Router e o ErrorBoundary é do Sentry). `shared/lib/faro.ts`: `initFaro(router)` desligado sem `VITE_FARO_URL`; Web Vitals, sessão e tracing do `/api` (mesma origem, `traceparent` automático); console fora; exceções descartadas no `beforeSend`; `/monitoring/` e `/socket.io/` fora do tracing; a view é o id da rota (`/servers/$serverId`), nunca a URL.
- `shared/lib/monitoring.ts` passou a falar com os dois SDKs: erros no Sentry, `measure()` e o id do usuário no Faro, com `measuring` falso sem Faro.
- Qualidade da call: `MediaTransport` ganhou `peerIds()` e `getConnectionStats()` (stats da conexão inteira). Regra pura `modules/rooms/model/rules/call-quality.ts` (par de candidatos em uso, relay ou direto, RTT, jitter e perda do áudio recebido, fps, altura, jitter e perda da tela recebida, fps, altura e limitação da tela enviada; perda entre duas leituras). `CallQualityReporter` lê cada conexão a cada 30 s e manda uma medida `webrtc` por pessoa, com `connection=relay|direct` no contexto; criado pelo `voice.controller` só quando o Faro está ligado.
- Tunnel `/monitoring/faro` no nginx, igual ao do Sentry (`FARO_COLLECTOR_URL` no `.env` do host). Conferido: payload de teste aceito (202) e visível no Loki com `kind=measurement`.

Suposições:
- O áudio recebido soma voz e áudio da tela, quando a pessoa compartilha som: as stats não dizem qual faixa é qual sem mapear os transceivers. *(suposição)*
- Não há resumo ao sair da call: quando a call termina o transport já fechou e as stats somem. A última leitura tem no máximo 30 s. *(suposição)*
- Espectadores ao vivo continuam fora (o servidor não sabe quem assiste). Dá para inferir pelas medidas com `screen_out_*` por conexão. *(suposição)*
