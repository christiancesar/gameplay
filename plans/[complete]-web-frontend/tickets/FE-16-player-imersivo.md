# FE-16 · Player imersivo da live e tela cheia no celular

> Pontos: 5 · Depende de: FE-10, FE-15 · Branch `fix/screen-share-audio`

## Contexto
Prints do usuário no iPhone (Safari), em 2026-10-26, assistindo uma live:
- Deitado, a barra "Gameplay", o cabeçalho da live e a coluna de pessoas tomavam boa parte da tela; o vídeo ficava com menos da metade. O overlay feito por media query (`phone-landscape:`) não pegou no aparelho dele, embora o build publicado tivesse o código.
- No iPhone a API de tela cheia só existe para `<video>`, que abre o player nativo com pausa e sem nada nosso por cima. O botão de tela cheia chamava `requestFullscreen` na caixa do vídeo, que lá não existe: não fazia nada.
- Em pé está aceitável. Pedido do usuário: não criar muitas variações de layout.

## Escopo
- Um modo imersivo nosso: o player cobre a tela (`fixed inset-0`), com os controles por cima (volume, pessoas, sair da tela cheia, parar de assistir, botão da sidebar). Um toque mostra ou esconde, e eles somem após 3 s.
- Tela cheia real onde existe (desktop, Android), com trava em paisagem no Android. No iPhone, só o imersivo.
- Celular deitado entra no imersivo sozinho, detectado por JS.
- Sem biblioteca de player.

## Fora do escopo
Layout em pé (fica como está). Preview do próprio streamer.

## Checklist
- [x] `shared/media/fullscreen.ts` tolerante à falta da API
- [x] `useMediaQuery` e regra `isImmersive`, com specs
- [x] Store e ViewModel do player, com specs
- [x] View imersiva e stories
- [x] e2e entra e sai do imersivo
- [x] Typecheck, lint e testes
- [x] Commit

## Notas da execução (2026-10-26)

- `shared/media/fullscreen.ts`: `enterStreamFullscreen` (resolve false sem a API ou com recusa do browser, trava em paisagem quando entra), `exitStreamFullscreen` e `onFullscreenExit`. O alvo é a raiz do player (`data-stream-stage`), não o `<video>`.
- `shared/lib/use-media-query.ts` com `PHONE_LANDSCAPE_QUERY`, a mesma do `phone-landscape`. O plano previa basear o `useIsMobile` nele, mas as regras de camada não deixam `shared/hooks` importar de `shared/lib`; o `use-mobile.ts` ficou como estava.
- Regra pura `model/rules/immersive.ts`: imersivo quando a pessoa pediu, ou com o celular deitado se ela não saiu dele deitada. Estado em `view-models/stores/stream-player.store.ts` (`expanded`, `landscapeOptOut`), zerado quando o player sai da tela.
- `useStreamWatchViewModel` expõe `immersive` e `onImmersiveChange`. Entrar pelo botão também pede a tela cheia real, dentro do clique. Esc ou o gesto do sistema saindo da tela cheia sai do imersivo.
- `StreamViewerView`: o layout normal ficou como antes, sem o `touch:hidden` (o volume funciona no iOS, passa pelo audio engine). No imersivo, barra com degradê por cima do vídeo, botão "Pessoas" que abre a coluna de participantes por cima, toque alterna os controles, duplo clique sai. Os overlays com `phone-landscape:` saíram do player; fora do imersivo, deitado, as pessoas ficam ao lado do vídeo.
- `ParticipantTileView` ganhou `row` e `ParticipantStripView` ganhou `layout="column"`: a linha compacta que antes só existia deitado agora vale em qualquer tela, para a coluna do imersivo.
- Conferido com Playwright no Storybook em 390x844 e 844x390 com toque. Cypress de voz e transmissão verdes, com o cenário de assistir entrando e saindo do imersivo. Web 1193 testes.

Suposições:
- No iPhone a barra do Safari continua visível no imersivo: sem a API de tela cheia não há como escondê-la. *(suposição)*
- Saindo do imersivo com o celular deitado, ele só volta sozinho depois de a pessoa virar o celular em pé e deitar de novo. *(suposição)*
- A barra "Gameplay" não precisou de mudança: o player imersivo fica por cima dela. *(suposição)*
- Não descobri por que as media queries `touch` e `phone-landscape` falharam no iPhone do usuário. O player novo não depende delas. *(suposição)*
