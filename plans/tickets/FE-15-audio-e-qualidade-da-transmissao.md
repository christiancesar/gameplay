# FE-15 · Áudio da transmissão e qualidade para quem assiste

> Pontos: 5 · Depende de: FE-10, OBS-04 · Branch `fix/screen-share-audio`

## Contexto
Relato do usuário em 2026-10-26: numa transmissão, a voz do streamer chegava, mas o áudio do jogo que ele compartilhava não. O streamer estava no **Firefox**, e o toggle de áudio estava ligado no nosso diálogo. O Firefox não captura áudio no `getDisplayMedia` (MDN e a página de controles do Chrome listam Firefox e Safari sem suporte), então essa é a causa mais provável, mas **não está confirmada**: falta uma medida do que o browser entregou.

O código de envio e recepção foi revisado e não mostrou bug: a faixa de áudio vai junto com o vídeo quando existe e o espectador toca pelo audio engine com volume próprio. O problema é que, quando o browser não entrega a faixa, ninguém fica sabendo.

Causas possíveis, da mais provável para a menos:
1. Browser sem áudio de captura (Firefox, Safari).
2. Fonte sem áudio no sistema: janela (só o Chrome 141+ tem a dica `windowAudio`), tela inteira no Linux, tela inteira no macOS antes do Chrome 141 ou do macOS 14.2.
3. Caixa de áudio desmarcada no seletor do browser.
4. `restrictOwnAudio` tirando o som de um jogo que roda numa aba do mesmo browser.

Pedido do usuário: aplicar todas as correções propostas e mostrar para quem assiste a resolução e o fps que chegam de fato, que podem ser diferentes do que o streamer vê.

## Escopo
- Suporte de áudio por browser, sistema e fonte, no lugar da regra que só olhava a fonte. Textos novos em en e pt.
- Dica `windowAudio: 'window'` quando a fonte é janela e o áudio foi pedido.
- Aviso para o streamer quando o áudio foi pedido e o browser não entregou.
- Indicador no painel do streamer: áudio da tela com som, em silêncio, não veio ou desligado.
- Medida `screen_share_start` no Faro: áudio pedido e recebido, fonte, superfície, browser e sistema.
- Para quem assiste: resolução, fps e bitrate recebidos (stats do `inbound-rtp` do vídeo) e aviso quando a transmissão não tem áudio.

## Fora do escopo
Seletor de qualidade do espectador (`media-transport-options.md`, seção 6, item 7). Captura de áudio por app nativo.

## Checklist
- [x] Regra de suporte de áudio por plataforma, com specs
- [x] `windowAudio` nas opções do `getDisplayMedia`
- [x] Aviso de áudio que não veio
- [x] Indicador de áudio no painel do streamer, com stories
- [x] Medida no Faro
- [x] Qualidade recebida e aviso de sem áudio no viewer, com stories
- [x] i18n en e pt
- [x] Typecheck, lint e testes
- [x] Commit

## Notas da execução (2026-10-26)

- A `feature/observability` (PR #5) foi mergeada na `feature/web-routing` depois que o PR #4 já tinha ido para a `main`, então a `main` não tem a observabilidade. A branch deste ticket saiu da `main` e recebeu um merge da `origin/feature/web-routing` para ter o Faro. Um PR desta branch para a `main` leva também o trabalho do PR #5.
- `model/rules/capture-platform.ts`: browser (reaproveita o `detectBrowser` do `browser-support`) e sistema, pelo Client Hints com fallback no user agent. `audioSupportFor(fonte, plataforma)` agora devolve `supported`, `recentMac`, `windowMaybe`, `tabOnly` ou `browserUnsupported`. O switch de áudio não fica mais desabilitado: nos casos improváveis (`tabOnly`, `browserUnsupported`) o texto fica em âmbar e o pedido segue, porque agora a transmissão avisa quando o áudio não vem e o Faro registra o caso.
- `displayMediaOptions` manda `windowAudio: 'window'` quando o áudio é pedido (`'exclude'` quando não). Browsers sem a opção ignoram.
- `ShareSession`: se o áudio foi pedido e o `getDisplayMedia` não trouxe faixa, o estado vira `audio: 'missing'` e sai o aviso `no-audio` (toast de alerta, não de erro). Com faixa, um `SpeakingDetector` lê o nível a cada 250 ms (limiar 0,005, mantém 2 s) e o painel mostra "Com som" ou "Em silêncio". `CallMedia.audio` passou a expor o `createMeter` do audio engine.
- Faro: medida `screen_share_start` com `audio_requested` e `audio_received` (0 ou 1) e contexto `source`, `surface`, `browser`, `engine`, `chromium_major` e `os`. Só é criada com o Faro ligado.
- Quem assiste: `WatchSession` lê o `inbound-rtp` do vídeo assistido a cada 1 s (pelo `trackIdentifier`, porque a conexão guarda entradas de telas anteriores) e calcula resolução, fps e bitrate. O cabeçalho do viewer mostra "1080p · 60 fps · 7.8 Mbps" (o bitrate some em telas pequenas). Sem faixa de áudio na transmissão, o ícone de volume vira o aviso "Esta transmissão está sem áudio" e o slider fica desabilitado.
- e2e: o cenário de assistir confere o rótulo da qualidade recebida. O cenário "reaches the peer" já falhava antes deste ticket: o preview do streamer repete o título quando a imagem está oculta. O teste agora busca o heading.
- Estado: web 1175 testes, api 311, Cypress de voz e transmissão verdes.

Suposições:
- A causa do caso relatado é o Firefox. Não está confirmada: a medida `screen_share_start` no Grafana vai mostrar se o áudio chegou ao browser do streamer. *(suposição)*
- O app já mostra o aviso de browser não suportado para Firefox (`browser-support`). O texto do diálogo de áudio repete a recomendação de Chrome ou Edge só para o áudio. *(suposição)*
- Os valores de `windowAudio` seguem o rascunho do W3C (`system`, `window`, `exclude`). Escolhi `window` para pegar o som do jogo e não o do sistema. Não há doc oficial do Chrome confirmando o comportamento. *(suposição)*
- Não detecto a versão do macOS (o user agent fica congelado em 10_15_7), então `recentMac` só avisa que precisa do 14.2. *(suposição)*
- O medidor de nível usa o AudioContext da call. Se ele estiver suspenso pela regra de autoplay, o painel mostra "Em silêncio" mesmo com som. Na prática a call começa com um clique. *(suposição)*
