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

Atualização do usuário na mesma sessão: o problema não era o browser. Com "Compartilhar áudio" marcado e a tela inteira compartilhada, uma música do YouTube não saiu, só a voz. Ou seja, o áudio do sistema não era capturado.

Pedido do usuário: aplicar todas as correções propostas e mostrar para quem assiste a resolução e o fps que chegam de fato, que podem ser diferentes do que o streamer vê.

## Escopo
- Suporte de áudio por browser, sistema e fonte, no lugar da regra que só olhava a fonte. Textos novos em en e pt.
- Switch de áudio travado onde o browser não entrega áudio da tela, avisando que só o microfone vai.
- Aviso para o streamer quando o áudio foi pedido e o browser não entregou.
- Indicador no painel do streamer: áudio da tela com som, em silêncio, não veio ou desligado.
- Medida `screen_share_start` no Faro: áudio pedido e recebido, fonte, superfície, browser e sistema.
- Para quem assiste: resolução, fps e bitrate recebidos (stats do `inbound-rtp` do vídeo) e aviso quando a transmissão não tem áudio.

## Fora do escopo
Seletor de qualidade do espectador (`media-transport-options.md`, seção 6, item 7). Captura de áudio por app nativo.

## Checklist
- [x] Regra de suporte de áudio por plataforma, com specs
- [x] Switch de áudio travado onde o browser não entrega áudio da tela
- [x] Aviso de áudio que não veio
- [x] Indicador de áudio no painel do streamer, com stories
- [x] Medida no Faro
- [x] Qualidade recebida e aviso de sem áudio no viewer, com stories
- [x] i18n en e pt
- [x] Typecheck, lint e testes
- [x] Commit

## Notas da execução (2026-10-26)

- A `feature/observability` (PR #5) foi mergeada na `feature/web-routing` depois que o PR #4 já tinha ido para a `main`, então a `main` não tem a observabilidade. A branch deste ticket saiu da `main` e recebeu um merge da `origin/feature/web-routing` para ter o Faro. Um PR desta branch para a `main` leva também o trabalho do PR #5.
- `model/rules/capture-platform.ts`: browser (reaproveita o `detectBrowser` do `browser-support`) e sistema, pelo Client Hints com fallback no user agent. `audioSupportFor(fonte, plataforma)` devolve `supported`, `recentMac`, `windowUnsupported`, `tabOnly` ou `browserUnsupported`.
- Decisão do usuário depois do teste dele (música no YouTube com a tela inteira compartilhada no Linux, só a voz saiu): onde o browser não entrega áudio da tela, o switch fica travado e desmarcado, com o aviso em âmbar terminando em "Só o áudio do microfone será compartilhado". Vale para janela ou jogo (sempre), tela inteira fora de Windows, ChromeOS e macOS recente, e Firefox e Safari. O ViewModel também não pede áudio nesses casos, mesmo com a preferência salva ligada.
- A dica `windowAudio` (Chrome 141+) entrou e saiu no mesmo ticket: com a janela sempre travada ela não tinha uso.
- Captura de áudio por dispositivo ("Monitor of …" no Linux, VB-Cable no Windows) foi discutida e descartada: pelo browser não dá para isolar o áudio de um app, só capturar a mistura de uma saída. O usuário quer resolver isso depois com Electron (áudio por processo).
- `ShareSession`: se o áudio foi pedido e o `getDisplayMedia` não trouxe faixa, o estado vira `audio: 'missing'` e sai o aviso `no-audio` (toast de alerta, não de erro). Com faixa, um `SpeakingDetector` lê o nível a cada 250 ms (limiar 0,005, mantém 2 s) e o painel mostra "Com som" ou "Em silêncio". `CallMedia.audio` passou a expor o `createMeter` do audio engine.
- Faro: medida `screen_share_start` com `audio_requested` e `audio_received` (0 ou 1) e contexto `source`, `surface`, `browser`, `engine`, `chromium_major` e `os`. Só é criada com o Faro ligado.
- Quem assiste: `WatchSession` lê o `inbound-rtp` do vídeo assistido a cada 1 s (pelo `trackIdentifier`, porque a conexão guarda entradas de telas anteriores) e calcula resolução, fps e bitrate. O cabeçalho do viewer mostra "1080p · 60 fps · 7.8 Mbps" (o bitrate some em telas pequenas). Sem faixa de áudio na transmissão, o ícone de volume vira o aviso "Esta transmissão está sem áudio" e o slider fica desabilitado.
- e2e: o cenário de assistir confere o rótulo da qualidade recebida. O cenário "reaches the peer" já falhava antes deste ticket: o preview do streamer repete o título quando a imagem está oculta. O teste agora busca o heading.
- Tela cheia (pedido do usuário na mesma sessão): o botão punha o próprio `<video>` em tela cheia, e o browser mostra os controles nativos nesse modo, com pausa. Pausar uma live só congelava a imagem, enquanto o áudio seguia pelo audio engine. Agora vai para tela cheia a caixa em volta do vídeo (`data-stream-stage`), sem controles nativos, e um duplo clique nela também alterna. O vídeo volta a tocar sozinho se algo pausar (teclas de mídia, picture in picture), e `disableRemotePlayback` tira o botão de transmitir para outro aparelho.
- Estado: web 1175 testes, api 311, Cypress de voz e transmissão verdes.

Suposições:
- Causa confirmada pelo teste do usuário: na tela inteira o browser não entregava o áudio do sistema (Linux só tem áudio de aba), com qualquer browser. A medida `screen_share_start` no Grafana segue útil para ver isso por sistema. *(suposição: o teste foi no Linux)*
- O app já mostra o aviso de browser não suportado para Firefox (`browser-support`). O texto do diálogo de áudio repete a recomendação de Chrome ou Edge só para o áudio. *(suposição)*
- Não detecto a versão do macOS (o user agent fica congelado em 10_15_7), então `recentMac` só avisa que precisa do 14.2. *(suposição)*
- Em tela cheia só aparece o vídeo: o volume e o "parar de assistir" ficam fora. Sai com Esc ou com duplo clique. *(suposição)*
- O medidor de nível usa o AudioContext da call. Se ele estiver suspenso pela regra de autoplay, o painel mostra "Em silêncio" mesmo com som. Na prática a call começa com um clique. *(suposição)*
