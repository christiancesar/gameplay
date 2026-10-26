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
- [ ] Regra de suporte de áudio por plataforma, com specs
- [ ] `windowAudio` nas opções do `getDisplayMedia`
- [ ] Aviso de áudio que não veio
- [ ] Indicador de áudio no painel do streamer, com stories
- [ ] Medida no Faro
- [ ] Qualidade recebida e aviso de sem áudio no viewer, com stories
- [ ] i18n en e pt
- [ ] Typecheck, lint e testes
- [ ] Commit
