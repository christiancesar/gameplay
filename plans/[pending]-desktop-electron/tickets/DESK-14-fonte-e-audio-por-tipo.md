# DESK-14 · Fonte e áudio por tipo de compartilhamento

> Pontos: 8 · Depende de: DESK-09 · Branch `feature/desktop-windows-audio`, por autorização do usuário em 2026-10-28

## Contexto

O DESK-08 trocou os cartões de tipo pela grade de fontes no Windows e X11. O usuário quer as duas etapas: escolher tela ou janela, depois o item disponível daquele tipo. A transmissão deve levar o áudio ligado à fonte, sem devolver a voz da call. A escolha manual de aplicativos de áudio fica para uma configuração futura.

## Escopo

- No Windows e X11, mostrar cartões de tela e janela acima da grade, com apenas as fontes do tipo escolhido. Guardar a escolha de cada tipo durante a abertura do diálogo e selecionar o primeiro item disponível ao trocar de tipo.
- No navegador, manter tela, janela e aba com o seletor do navegador. No Wayland, manter o aviso e o seletor do portal.
- Tirar a lista de aplicativos de áudio do diálogo, mantendo o provider para uso futuro. O interruptor liga o áudio da fonte: tela inteira usa o áudio do sistema sem o Gameplay; janela usa o processo dono da janela quando possível. No Wayland, a janela usa o áudio do sistema sem o Gameplay porque o portal não fornece seu processo.
- No Windows, o auxiliar WASAPI aceita o identificador da janela e captura a árvore de processos correspondente. No X11, resolver o PID da janela e incluir esse processo no PipeWire; se não puder resolver, usar o áudio do sistema sem o Gameplay.
- Atualizar contrato, ViewModel, Views, stories, testes, i18n e documentação. Gerar builds locais de Windows e Linux para revisão.

## Fora do escopo

Configuração manual de aplicativos de áudio, macOS, assinatura do Windows, atualização automática e publicação de release.

## Checklist

- [x] Cartões de tipo e grade filtrada no Windows/X11, com stories e testes de interação
- [x] Seleção preservada por tipo durante o diálogo, com testes do ViewModel
- [x] Áudio automático sem a call no Linux, sem a lista manual no diálogo
- [x] Áudio da janela no Windows e X11 quando o processo é conhecido, com testes
- [x] i18n em inglês e português
- [x] Typecheck, lint, formato e testes verdes
- [x] Builds locais de Windows e Linux gerados

## Suposições

- *(suposição)* O desktop mostra dois cartões, porque o Electron não oferece uma aba isolada como fonte. O navegador mantém três.
- *(suposição)* O Wayland usa o portal para escolher tela ou janela e o som do computador sem o Gameplay para qualquer escolha, porque o portal não revela o PID da janela.
- *(suposição)* Se o PID da janela não puder ser resolvido no X11, o áudio cai para o sistema sem o Gameplay.
- *(suposição)* No X11, o nome do executável em `/proc/<pid>/exe` coincide com `application.process.binary` do PipeWire para a janela escolhida. A correspondência depende do aplicativo e precisa de conferência manual com jogos.

## Notas da execução

- O diálogo mostra os cartões de tela e janela no Windows e no X11, com a grade filtrada logo abaixo. Cada tipo guarda seu item selecionado enquanto o diálogo está aberto. O browser continua com três cartões e o seletor próprio; o Wayland continua com o portal.
- O áudio automático do Linux usa o modo `system` do venmic para tela e Wayland. No X11, o PID da janela vem de `_NET_WM_PID` via `xprop`, e o executável desse PID seleciona os nós do PipeWire. Se o PID não estiver disponível, volta ao modo `system`.
- O Windows usa o modo `window` do auxiliar WASAPI já implementado nesta branch. A lista manual de aplicativos de áudio saiu do diálogo; o provider e o contrato de lista ficam para uma configuração futura.
- `npm run typecheck`, `npm run lint`, `npm run format:check` e `npm test` passaram. O client teve 1320 testes; o desktop, 125; o bridge, 13.
- Builds locais gerados em `apps/desktop/out/make`: instalador Squirrel e ZIP de Windows, DEB e ZIP de Linux, todos `0.0.0`. Confirmados o auxiliar no ZIP de Windows e o venmic no DEB.
- Não houve conferência manual da nova interface ou do áudio numa chamada real no Windows ou X11. Os builds são de desenvolvimento e não estão assinados.
