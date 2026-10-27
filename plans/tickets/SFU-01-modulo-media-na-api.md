# SFU-01 · Módulo `media` na API: sessões e tracks do Cloudflare Realtime SFU

> Pontos: 8 · Modelo sugerido: Opus · Depende de: BE-12, BE-14 · Onda 1

## Contexto
A tela passa a ir pelo Cloudflare Realtime SFU por padrão, com o mesh como opção no diálogo de compartilhar (decisão do usuário em 2026-10-27). O browser nunca fala direto com a API da Cloudflare: o App Secret fica só no servidor, e é a nossa API que cria sessões, publica e assina tracks, sempre conferindo quem pode fazer o quê. A voz continua em mesh e não passa por aqui.

O SFU não precisa do RealtimeKit. Usamos só a API de conexão (`https://rtc.live.cloudflare.com/v1/apps/{appId}/...`). As credenciais já estão no env: `CLOUDFLARE_SFU_APP_ID` e `CLOUDFLARE_SFU_APP_TOKEN`, o mesmo app para desenvolvimento e produção.

## Escopo
- Módulo `media` na API. O `ice` continua como está *(suposição: juntar `ice` e `media` num módulo só fica para depois, se valer a pena)*.
- `SfuProvider` (abstract class) com `CloudflareSfuProvider` (HTTP para a API da Cloudflare, timeout curto) e um fake para os testes.
- Disponibilidade do SFU: ligado quando as duas variáveis existem. `GET /api/media/sfu` responde `{ available, reason }`, com `reason` em `not-configured`, `budget-exhausted` (usado no SFU-03) ou `unavailable`.
- Rotas autenticadas que espelham a API da Cloudflare, sempre para quem está numa sala de voz:
  - criar sessão com a oferta SDP do browser e devolver a resposta;
  - publicar a tela (tracks locais com `mid` e `trackName`);
  - assinar a tela de alguém da mesma sala, a partir do `streamerId`, com `simulcast.preferredRid`;
  - trocar a camada assinada (`tracks/update`);
  - renegociar e fechar tracks.
- Registro em memória de quem é dono de cada sessão e de quais tracks cada streamer publicou. O espectador nunca recebe nem informa o `sessionId` de outra pessoa; a API resolve isso pelo `streamerId` *(suposição)*.
- Contrato: `stream:start` passa a levar o modo (`sfu` ou `mesh`), e o participante na sala passa a dizer em que modo está transmitindo, para o espectador saber como assistir. Com `sfu`, a API só aceita o `stream:start` se a pessoa já publicou a tela no SFU.
- Ao parar a transmissão, sair da sala ou desconectar, a API fecha as tracks da pessoa na Cloudflare e limpa o registro.
- Schema de env: as duas variáveis continuam opcionais. Sem elas, o SFU fica indisponível e o web oferece só o mesh.

## Fora do escopo
Transporte no web e seletor de modo (SFU-02). Orçamento, medição de consumo e seletor de qualidade (SFU-03). Voz pelo SFU. Troca de modo no meio da live.

## Referências
- `plans/media-transport-options.md` (seção 7, desenho atualizado)
- `plans/06-producao-aws.md` seção 10
- Cloudflare: [Connection API](https://developers.cloudflare.com/realtime/sfu/api/), [Simulcast](https://developers.cloudflare.com/realtime/sfu/features/simulcast/), [Limits](https://developers.cloudflare.com/realtime/sfu/platform/limits/), [OpenAPI](https://developers.cloudflare.com/realtime/static/realtime-api-2024-05-21.yaml)

## Checklist
- [ ] Conferir no OpenAPI da Cloudflare o corpo de cada rota (publicar, assinar com simulcast, `tracks/update`, renegociar, fechar)
- [ ] `SfuProvider` com a implementação da Cloudflare (HTTP mockado nos testes) e o fake
- [ ] Rota de disponibilidade e rotas de sessão e tracks, com e2e
- [ ] Permissões: só quem está na sala publica e assina; só o dono da sessão mexe nela
- [ ] Modo no contrato do `stream:start` e do participante
- [ ] Limpeza ao parar, sair e desconectar
- [ ] Commit

## Critério de aceite
Com as credenciais no env, um browser consegue publicar a tela no SFU pela nossa API e outro da mesma sala consegue assinar escolhendo a camada. Sem as credenciais, `GET /api/media/sfu` responde indisponível e nada mais muda. Ninguém de fora da sala consegue assinar.
