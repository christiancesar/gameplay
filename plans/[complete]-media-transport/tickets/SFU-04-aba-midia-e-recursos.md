# SFU-04 · Aba Mídia no admin e recursos de mídia por servidor

> Pontos: 8 · Modelo sugerido: Opus · Depende de: SFU-01, SFU-05 · Onda 2

## Contexto
O admin da plataforma quer ligar e desligar os recursos de mídia de forma global e por servidor, por causa de custo ou de problema no provedor (decisões do usuário em 2026-10-27). Os recursos são **Servidor (SFU)**, **Direto (Mesh)** e **Relay (TURN)**. A configuração por servidor segue a regra dos limites numéricos: cada servidor usa o global, a não ser que o admin defina outro valor só para ele, nos dois sentidos. Tudo isso é do admin da plataforma; owner e admin do servidor não mexem aqui.

O diálogo "Ajustar limites" de `/admin/servers` hoje esconde o valor numérico próprio: o switch apagado mostra "Usar o padrão global (10)" e o campo de número só aparece ao ligar o switch, o que não é intuitivo. Como o diálogo vai ser mexido, a correção entra aqui.

Separar **recurso** (o que se liga e desliga) de **provedor** (quem entrega: Cloudflare, coturn, LiveKit no futuro). As credenciais continuam no `.env`. Agora o admin só vê qual provedor está em uso; escolher entre provedores fica para quando houver um segundo configurado *(suposição)*.

## Escopo
### API
- Configuração global dos três recursos nos `platform-settings` do `limits`. Padrão: tudo ligado. Os dois modos de transmissão podem ficar desligados ao mesmo tempo.
- Override por servidor de cada recurso: padrão global, ligado ou desligado.
- Recursos efetivos de um servidor = override do servidor, senão o global.
- Rota para o web saber, num servidor, os recursos efetivos e a disponibilidade de cada um (ligado, provedor pronto ou não, motivo: `disabled`, `not-configured`, `budget-exhausted`, `unavailable`).
- Estado de cada provedor para a aba Mídia: qual está em uso e se está pronto (credenciais presentes, última verificação). Reaproveitar o health do OBS-06 se servir.
- A API recusa `stream:start` e as rotas do SFU num modo desligado.
- `/api/ice` passa a receber o servidor da sala: sem TURN no servidor, só STUN. O cache de credenciais passa a considerar o servidor.
- **Desligar derruba** (decisão do usuário em 2026-10-27):
  - SFU ou Mesh: as lives naquele modo param na hora (no SFU a API fecha as tracks na Cloudflare). Quem assistia vê "Transmissão encerrada pelo administrador". Não há migração automática para o outro modo; quem transmitia recomeça, se quiser.
  - TURN: os clientes recebem pelo socket a ordem de refazer o ICE só com STUN. Quem precisava de relay perde a conexão. As credenciais já entregues são revogadas na Cloudflare, se a API deles permitir; se não permitir, o TTL das credenciais cai para 1 h, e o corte vale no máximo nesse prazo *(a verificar)*.
- Contagem dos afetados antes de desligar (lives por modo, pessoas usando TURN), para a confirmação.
- Mudanças avisam os clientes pelo socket, para o diálogo de compartilhar e as calls se atualizarem.

### Web
- Nova aba **Mídia** (`/admin/media`, rota filha do admin). Um bloco por recurso, com:
  - ligado ou desligado no global;
  - provedor e estado ("Cloudflare, configurado", "Sem credenciais no servidor", "Falhou na última verificação"); o Mesh não tem provedor;
  - uma linha explicando o recurso, com os mesmos textos do diálogo de compartilhar; no TURN, o aviso de que sem ele parte das pessoas pode não conectar;
  - no SFU, espaço para o consumo do mês e o orçamento (preenchido no SFU-03).
  - No fim, a lista **Exceções por servidor**: servidores com configuração diferente da global e qual é a diferença. Cada linha abre o diálogo do servidor.
- O diálogo de `/admin/servers` passa a se chamar **Ajustar servidor**, com os limites numéricos e os recursos de mídia.
- Correção dos limites numéricos: o campo de número fica sempre visível, com a caixa "Usar o padrão global (10)" ao lado. Marcada, o campo fica desabilitado mostrando o global; desmarcada, o admin digita o valor do servidor.
- Confirmação ao desligar um recurso (global ou de um servidor): quantos serão afetados agora, mensagem com texto sugerido e editável, destinatários (só os afetados, os membros do servidor ou todo mundo), e os botões "Desligar e avisar" e "Desligar sem avisar". Religar oferece o aviso de volta. O envio usa o SFU-05.
- i18n em `en` e `pt`, stories e testes.

## Fora do escopo
Diálogo de compartilhar e transporte (SFU-02). Orçamento e medição (SFU-03). Envio e exibição dos avisos (SFU-05). Escolher provedor no admin. Escolha automática do modo pelo número de espectadores.

## Referências
- `plans/[complete]-media-transport/media-transport-options.md` seção 7
- `plans/[complete]-backend/tickets/BE-06-limites-e-configuracoes.md`, `BE-13-notificacoes.md`, `BE-14-ice-e-ip.md`, `BE-15-admin-da-plataforma.md`, `FE-11-admin.md`, `OBS-06-health-detalhado.md`

## Checklist
- [x] Conferir se a API de TURN da Cloudflare permite revogar credenciais
- [x] Migração do Prisma para os recursos globais e por servidor
- [x] Regra dos recursos efetivos com testes
- [x] Rotas de recursos efetivos, estado dos provedores e contagem de afetados, com e2e
- [x] Recusa no `stream:start` e nas rotas do SFU; `/api/ice` por servidor
- [x] Derrubada de lives e de TURN ao desligar, e aviso pelo socket
- [x] Aba Mídia, diálogo "Ajustar servidor" e campo numérico corrigido, com stories
- [x] Confirmação ao desligar, usando o SFU-05
- [x] i18n e testes
- [x] Commit

## Critério de aceite
Desligar o SFU na aba Mídia encerra as lives que estão no SFU e tira o modo do diálogo de compartilhar em todos os servidores sem exceção. Um servidor com exceção mantém o SFU ligado. Dar 20 membros a um servidor com o global em 10 é feito direto pelo campo numérico. Desligar o TURN faz quem depende dele perder a conexão, e os destinatários escolhidos recebem o aviso.

## Notas da execução
- **Onde mora o quê:** os interruptores ficam no módulo `limits` (colunas `sfuEnabled`, `meshEnabled` e `turnEnabled` em `platform_settings`, com padrão ligado, e as mesmas colunas, nulas, em `server`; migration `media_resources`). O `EffectiveMediaService` resolve o valor de um servidor (o dele, senão o global) e é lido em toda checagem, então a mudança vale na hora. O `realtime`, o `ice` e o `media` leem dele; quem orquestra a mudança é o `media`.
- **Rotas do admin** (com 2FA): `GET /api/admin/media` (configuração global, provedores e exceções), `GET /api/admin/media/impact?serverId=` (quantas pessoas cada recurso derrubaria agora), `PUT /api/admin/media`, `GET` e `PUT /api/admin/servers/:serverId/media`. Os `PUT` aceitam `notice` (título, mensagem e destinatário) e respondem `{ notified }`. No global o destinatário é `affected` ou `everyone`; no servidor também `members`.
- **Rota dos membros:** `GET /api/servers/:serverId/media` responde o que o servidor oferece agora (`sfu` com motivo `disabled` ou `not-configured`, `mesh`, `turn`). Quem não é membro recebe 404. É o que o SFU-02 vai ler.
- **Quem é "afetado":** quem está em sala de voz de um servidor onde o recurso passou de ligado para desligado. No SFU e no Mesh, todos da sala onde há uma live naquele modo; no TURN, todos das salas daquele servidor. *(Suposição: quem está fora de sala não conta, porque não está usando nada naquele momento.)* A contagem da confirmação mostra o maior número entre os recursos que vão desligar, porque as pessoas podem se repetir *(suposição)*.
- **Derrubar:** ao salvar, a API publica `media.changed`. O `realtime` para as lives no modo desligado (o seat fica sem `streaming`, quem transmitia recebe `stream:ended` com `reason: 'disabled'`, a sala é anunciada e o SFU fecha as tracks pelo `stream.changed`) e emite `media:changed` (`{ serverId, turnOff: false }`) para quem segue o servidor, ou para todos quando é global. Quem perdeu o TURN recebe também `media:changed` com `turnOff: true`, para refazer o ICE só com STUN. O `ice` revoga as credenciais TURN dessas pessoas na Cloudflare (`POST /v1/turn/keys/{keyId}/credentials/{username}/revoke`, conferido na documentação) e tira do cache. No coturn não há revogação; a credencial expira no TTL.
- **`/api/ice?serverId=`:** com o TURN desligado naquele servidor (ou no global, sem `serverId`) responde só STUN. O web ainda não manda o `serverId`; isso entra no SFU-02.
- **Recusas:** `stream:start` num modo desligado volta `STREAM_MODE_DISABLED`; criar sessão ou publicar no SFU desligado volta `SFU_DISABLED` (409).
- **Provedores na aba:** SFU "cloudflare, configurado" ou "sem credenciais"; TURN pelo `IceHealthService` (que já existia para o health): pronto, falhou na última verificação, ou sem provedor quando é `stun-only`. O Mesh não tem provedor.
- **Web:**
  - Aba **Mídia** (`/admin/media`) com um bloco por recurso (interruptor, explicação e estado do provedor) e a lista **Exceções por servidor**. "Ajustar" abre `/admin/servers?edit=<id>`, que já abre o diálogo daquele servidor.
  - O diálogo de servidor virou **Ajustar {nome}**, com os limites numéricos e uma escolha por recurso: "Padrão global (Ligado/Desligado)", "Ligado neste servidor" ou "Desligado neste servidor".
  - **Campo numérico corrigido** (vale também para o limite por usuário): o número aparece sempre; com a caixa "Usar o padrão global (N)" marcada, o campo mostra o global e fica travado; desmarcando, dá para digitar o valor do servidor.
  - **Confirmação** ao desligar (na aba ou no diálogo): quantas pessoas perdem o recurso agora, aviso com título e mensagem sugeridos e editáveis, destinatário, e os botões "Desligar e avisar" e "Desligar sem avisar". Ligar não pede confirmação. *(Suposição: religar não oferece aviso de volta; dá para mandar um pela aba Avisos.)*
  - O espaço do orçamento no bloco do SFU fica para o SFU-03.
- **Stories:** `Admin/AdminPanel` com `Media`, `MediaNoExceptions`, `MediaToggle`, `MediaOffConfirm`, `ServerLimitsOwnValue` (campo numérico e escolha de mídia) e `ServerLimitsValidation` atualizada.
- **Testes:** API com 355+ unitários (regra de quem é cortado, mudanças, impacto, recusas, revogação, parada das lives) e e2e (`media-resources`: desligar o Mesh com uma live no ar derruba, avisa os afetados e recusa nova live; exceção por servidor nos dois sentidos; o que o membro vê; só admin muda). Web com 1218 testes (unitários e Storybook). O e2e rodou com Postgres temporário; o do S3 não rodou. Não abri o app no browser para conferir o visual.
