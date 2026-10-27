# SFU-02 · Transmissão pelo SFU no web, com o mesh como opção

> Pontos: 8 · Modelo sugerido: Opus · Depende de: SFU-01, SFU-04 · Onda 4

## Contexto
Hoje a tela vai pelas mesmas conexões da voz: `MediaTransport.addTrack(peerId)` manda uma cópia para cada espectador. No SFU quem transmite publica uma vez e cada espectador puxa pela API. Esse formato não cabe na interface atual, então a tela ganha um transporte próprio, com uma implementação de mesh (o código de hoje) e uma de SFU. A voz não muda.

## Escopo
- Abstração de transporte da tela em `shared/media`, com duas implementações:
  - mesh: reaproveita o `MeshTransport` como hoje (pedido de quem assiste pelo socket, uma conexão por espectador);
  - SFU: um `RTCPeerConnection` dedicado à tela, negociado pela API do SFU-01. Quem transmite publica com simulcast (três camadas por `sendEncodings` com `rid`, por exemplo `f`, `h` e `q`, a partir do preset); quem assiste assina pela API com a camada maior.
- `share-session.service` e `watch-session.service` escolhem a implementação pelo modo da transmissão. ViewModels e Views só veem o modo.
- Diálogo antes de transmitir (`share-setup-dialog`): escolha de modo, com estes nomes e explicações (decisão do usuário em 2026-10-27):
  - **Servidor (SFU)**, padrão: "Melhor para várias pessoas assistindo. Você envia uma vez só para um servidor dedicado, e este servidor distribui cópias da sua transmissão sem dividir seu upload."
  - **Direto (Mesh)**: "Melhor para 1:1, com menor atraso. Seu upload é dividido entre quem assiste."
- O diálogo mostra só os modos ligados no servidor (SFU-04). Abre em "Servidor (SFU)" quando ele está ligado e disponível *(suposição: não lembra a última escolha)*. Um modo ligado mas indisponível (SFU sem credenciais, sem orçamento ou com erro) aparece desabilitado, com o motivo. Com os dois modos desligados, o botão de compartilhar tela fica desabilitado com "Transmissão desativada neste servidor"; a voz continua.
- Live encerrada pelo admin (SFU-04): quem transmitia e quem assistia veem "Transmissão encerrada pelo administrador".
- TURN desligado durante a call (SFU-04): refazer o ICE só com STUN quando chegar `media:changed` com `turnOff: true`.
- O que o servidor oferece vem de `GET /api/servers/:serverId/media`, refeito a cada `media:changed`. O `/api/ice` passa a receber `serverId` da sala. A live encerrada pela API chega como `stream:ended` (`reason: 'disabled'`) para quem transmitia.
- Se a publicação no SFU falhar ao começar e o Direto estiver ligado, a transmissão cai sozinha para Direto, com a mesma captura (sem abrir o seletor do browser de novo), e mostra um aviso. Se o Direto estiver desligado, a live não começa e o erro aparece (decisão do usuário em 2026-10-27).
- Áudio:
  - **Voz** (microfone): continua sempre em mesh, nos dois modos. Nada muda.
  - **Áudio da tela** (FE-15): segue o modo da transmissão. No SFU é publicado como mais uma track na mesma sessão do vídeo, sem camadas, e quem assiste puxa junto com a imagem. No mesh, como hoje.
  - No SFU, quem assiste ouve a voz de quem transmite pelo mesh e o som da tela pela Cloudflare. Conferir no teste manual se a diferença entre os dois é perceptível.
- Selo "Servidor (SFU)" ou "Direto (Mesh)" no monitor da live. No SFU, o monitor mostra o envio para a Cloudflare (camadas, bitrate, `qualityLimitationReason`) em vez da tabela por espectador.
- i18n em `en` e `pt`, stories para os estados novos do diálogo e do monitor, testes de ViewModel e dos serviços com fakes.

## Fora do escopo
Seletor de qualidade do espectador e orçamento (SFU-03). Configuração dos recursos e derrubada pela API (SFU-04). Escolha automática do modo pelo número de espectadores (trabalho futuro). Qualidade de cada espectador no monitor em modo SFU (SFU-03). Troca de modo no meio da live. E2E do SFU no Cypress, que depende da Cloudflare de verdade *(suposição: conferido à mão com o app no ar)*.

## Referências
- `plans/media-transport-options.md` seção 7
- `plans/tickets/FE-10-transmissao.md`, `FE-15-audio-e-qualidade-da-transmissao.md`
- Cloudflare: [Simulcast](https://developers.cloudflare.com/realtime/sfu/features/simulcast/)

## Checklist
- [ ] Transporte da tela separado, mesh sem mudança de comportamento (testes atuais e E2E do FE-14b verdes)
- [ ] Implementação SFU com simulcast, publicar e assinar
- [ ] Modo no diálogo com os nomes e as explicações acima, respeitando os modos ligados, e o caso dos dois desligados
- [ ] Queda para Direto com aviso, só quando o Direto está ligado
- [ ] Áudio da tela no SFU, junto do vídeo
- [ ] Selo e envio para o SFU no monitor
- [ ] Stories, i18n e testes
- [ ] Teste manual com dois browsers e o app apontando para a Cloudflare
- [ ] Commit

## Critério de aceite
Com o SFU disponível, uma live aberta sem mexer no modo vai pela Cloudflare, com imagem e som da tela, e o upload de quem transmite não cresce quando entra mais um espectador. Escolhendo "Direto (Mesh)", tudo funciona como hoje. O diálogo só mostra os modos ligados e explica por que um modo está indisponível.
