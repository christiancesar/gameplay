# SFU-02 · Transmissão pelo SFU no web, com o mesh como opção

> Pontos: 8 · Modelo sugerido: Opus · Depende de: SFU-01 · Onda 2

## Contexto
Hoje a tela vai pelas mesmas conexões da voz: `MediaTransport.addTrack(peerId)` manda uma cópia para cada espectador. No SFU quem transmite publica uma vez e cada espectador puxa pela API. Esse formato não cabe na interface atual, então a tela ganha um transporte próprio, com uma implementação de mesh (o código de hoje) e uma de SFU. A voz não muda.

## Escopo
- Abstração de transporte da tela em `shared/media`, com duas implementações:
  - mesh: reaproveita o `MeshTransport` como hoje (pedido de quem assiste pelo socket, uma conexão por espectador);
  - SFU: um `RTCPeerConnection` dedicado à tela, negociado pela API do SFU-01. Quem transmite publica com simulcast (três camadas por `sendEncodings` com `rid`, por exemplo `f`, `h` e `q`, a partir do preset); quem assiste assina pela API com a camada maior.
- `share-session.service` e `watch-session.service` escolhem a implementação pelo modo da transmissão. ViewModels e Views só veem o modo.
- Diálogo antes de transmitir (`share-setup-dialog`): escolha de modo **Via servidor** (padrão) ou **Direto**, cada um com uma linha explicando quando usar. O diálogo abre sempre em "Via servidor" *(suposição)*. Se o SFU estiver indisponível, só "Direto" fica habilitado, com o motivo.
- Se a publicação no SFU falhar ao começar, a transmissão cai para Direto e mostra um aviso *(suposição)*.
- Selo "Via servidor" ou "Direto" no monitor da live. No SFU, o monitor mostra o envio para a Cloudflare (camadas, bitrate, `qualityLimitationReason`) em vez da tabela por espectador.
- Áudio da tela (FE-15) também publicado no SFU quando existir.
- i18n em `en` e `pt`, stories para os estados novos do diálogo e do monitor, testes de ViewModel e dos serviços com fakes.

## Fora do escopo
Seletor de qualidade do espectador e orçamento (SFU-03). Qualidade de cada espectador no monitor em modo SFU (SFU-03). Troca de modo no meio da live. E2E do SFU no Cypress, que depende da Cloudflare de verdade *(suposição: conferido à mão com o app no ar)*.

## Referências
- `plans/media-transport-options.md` seção 7
- `plans/tickets/FE-10-transmissao.md`, `FE-15-audio-e-qualidade-da-transmissao.md`
- Cloudflare: [Simulcast](https://developers.cloudflare.com/realtime/sfu/features/simulcast/)

## Checklist
- [ ] Transporte da tela separado, mesh sem mudança de comportamento (testes atuais e E2E do FE-14b verdes)
- [ ] Implementação SFU com simulcast, publicar e assinar
- [ ] Modo no diálogo, padrão "Via servidor", "Direto" quando o SFU não está disponível
- [ ] Queda para Direto com aviso
- [ ] Selo e envio para o SFU no monitor
- [ ] Stories, i18n e testes
- [ ] Teste manual com dois browsers e o app apontando para a Cloudflare
- [ ] Commit

## Critério de aceite
Com o SFU disponível, uma live aberta sem mexer no modo vai pela Cloudflare, e o upload de quem transmite não cresce quando entra mais um espectador. Escolhendo "Direto", tudo funciona como hoje. Sem o SFU, o diálogo oferece só "Direto" e diz por quê.
