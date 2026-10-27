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
- Contrato: `stream:start` passa a levar o modo (`sfu` ou `mesh`), e o participante na sala passa a dizer em que modo está transmitindo, para o espectador saber como assistir. Com `sfu`, a API só aceita o `stream:start` se a pessoa já publicou a tela no SFU. A conferência dos modos permitidos entra no SFU-04.
- A tela publica vídeo e, quando houver, o áudio da tela (FE-15) na mesma sessão. A voz não passa pelo SFU.
- Ao parar a transmissão, sair da sala ou desconectar, a API fecha as tracks da pessoa na Cloudflare e limpa o registro.
- Schema de env: as duas variáveis continuam opcionais. Sem elas, o SFU fica indisponível e o web oferece só o mesh.

## Fora do escopo
Transporte no web e seletor de modo (SFU-02). Orçamento, medição de consumo e seletor de qualidade (SFU-03). Voz pelo SFU. Troca de modo no meio da live.

## Referências
- `plans/media-transport-options.md` (seção 7, desenho atualizado)
- `plans/06-producao-aws.md` seção 10
- Cloudflare: [Connection API](https://developers.cloudflare.com/realtime/sfu/api/), [Simulcast](https://developers.cloudflare.com/realtime/sfu/features/simulcast/), [Limits](https://developers.cloudflare.com/realtime/sfu/platform/limits/), [OpenAPI](https://developers.cloudflare.com/realtime/static/realtime-api-2024-05-21.yaml)

## Checklist
- [x] Conferir no OpenAPI da Cloudflare o corpo de cada rota (publicar, assinar com simulcast, `tracks/update`, renegociar, fechar)
- [x] `SfuProvider` com a implementação da Cloudflare (HTTP mockado nos testes) e o fake
- [x] Rota de disponibilidade e rotas de sessão e tracks, com e2e
- [x] Permissões: só quem está na sala publica e assina; só o dono da sessão mexe nela
- [x] Modo no contrato do `stream:start` e do participante
- [x] Limpeza ao parar, sair e desconectar
- [x] Commit

## Critério de aceite
Com as credenciais no env, um browser consegue publicar a tela no SFU pela nossa API e outro da mesma sala consegue assinar escolhendo a camada. Sem as credenciais, `GET /api/media/sfu` responde indisponível e nada mais muda. Ninguém de fora da sala consegue assinar.

## Notas da execução
- **Contrato** (`packages/contracts`): `STREAM_MODES` (`sfu`, `mesh`). O `stream:start` aceita `mode`, com `mesh` como padrão, para o web atual continuar funcionando sem mudança até o SFU-02. O participante ganhou `streamMode` (nulo quando não transmite). Schemas REST novos em `realtime/sfu.ts`.
- **Rotas** (todas com sessão, em `/api/media/sfu`):
  - `GET /` responde `{ available, reason }`. Hoje o único motivo é `not-configured`; `disabled` e `budget-exhausted` entram no SFU-04 e no SFU-03. *(Suposição: não criei o motivo `unavailable` agora, porque ainda não há verificação de saúde da Cloudflare; ela entra no SFU-04.)*
  - `POST /sessions` cria a sessão na Cloudflare, presa à sala de voz da pessoa.
  - `POST /sessions/:id/publish` com a oferta do browser e as tracks (`mid` e `kind`). O nome de cada track é `screen-<kind>-<mid>`.
  - `POST /sessions/:id/watch` com `streamerId` e `layer` (`f`, `h` ou `q`, padrão `f`). A API acha a sessão de quem transmite; o `sessionId` dela nunca vai para o web. O simulcast só vai na track de vídeo.
  - `PUT /sessions/:id/renegotiate` (204), `PUT /sessions/:id/layer` (204, `tracks/update` da Cloudflare) e `PUT /sessions/:id/close` (com oferta renegocia; sem oferta fecha com `force`).
- **Permissões:** criar sessão exige estar numa sala de voz (vale também durante a espera de reconexão). Cada rota de sessão confere o dono e se a sessão é da sala onde a pessoa está agora; senão responde 404. Assistir exige quem transmite na mesma sala, em modo `sfu`, com a tela publicada daquela sala.
- **`stream:start` em `sfu`** só é aceito com a tela (vídeo) publicada a partir da mesma sala; senão o ack volta com `SCREEN_NOT_PUBLISHED`.
- **Onde ficam as sessões:** o registro em memória (`SfuSessionStore`) está no módulo `realtime`, porque o `stream:start` precisa dele. O módulo `media` importa o `realtime` e escreve nele; o `realtime` não conhece o `media`. A limpeza vem por eventos de domínio que o `realtime` publica: `voice.left-room` (saiu, mudou de sala, foi removido ou a espera de reconexão acabou) e `stream.changed` (começou, mudou ou parou; com modo diferente de `sfu`, a tela publicada é fechada). Uma falha da Cloudflare na limpeza só gera log e nunca trava a sala.
- **Simulcast:** `priorityOrdering` e `ridNotAvailable` em `asciibetical`, para a Cloudflare descer de `f` para `h` e `q` quando a camada não existe ou a rede de quem assiste não aguenta. *(Suposição.)* A resposta do `tracks/update` pode pedir renegociação; a documentação não deixa claro quando. Conferir no teste manual do SFU-02.
- **Limite:** 4 sessões por pessoa (uma para publicar e uma para assistir por aba é o normal). *(Suposição.)*
- **Erros:** `SFU_NOT_CONFIGURED` (503), `SFU_FAILED` (502, recusa ou timeout de 5 s da Cloudflare, inclusive erro por track vindo com status 200), `SFU_SESSION_NOT_FOUND` e `SFU_TRACK_NOT_FOUND` (404), `SFU_SESSION_LIMIT` (429).
- **Credenciais:** com as variáveis do `apps/api/.env`, um `POST /sessions/new` direto na Cloudflare respondeu 201. O e2e fixa as duas variáveis vazias, para nunca chamar a Cloudflare de verdade; a suíte do SFU usa um fake.
- **Testes:** unitários do provider (HTTP mockado), dos use-cases e da limpeza; e2e com o app inteiro e o SFU fake (publicar, `stream:start` antes e depois da publicação, assistir, renegociar, sala diferente, sessão de outra pessoa, sem sala, sem credenciais). O `infra/docker-compose.dev.yml` foi removido, então rodei o e2e com um Postgres temporário (`docker run --rm`, já parado). O e2e do S3 não rodou, porque precisa do s3mock.
