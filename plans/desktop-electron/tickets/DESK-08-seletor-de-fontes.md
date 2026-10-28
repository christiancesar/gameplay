# DESK-08 · Seletor de fontes do app (Windows e X11)

> Pontos: 5 · Depende de: DESK-07 · Branch `feature/desktop-source-picker`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seções 3.3 e 3.4. Hoje o main responde ao `getDisplayMedia` com o primeiro monitor (quebra-galho do DESK-05). No Windows e no Linux com X11 o `desktopCapturer.getSources` lista telas e janelas com miniatura e ícone, então o seletor passa a ser nosso, dentro do diálogo de compartilhar. No Wayland o app não consegue listar nada: quem escolhe é o portal do sistema, e o diálogo só avisa isso.

**Conferido em 2026-10-28 na VM Windows 10 (Electron 45.1.0):** `getSources` devolveu 3 janelas e 1 tela, com miniaturas preenchidas (150 px: 2 a 7 KB; 320 px: 8 a 23 KB), `appIcon` nas janelas e nenhum ícone na tela. Levou de 175 a 205 ms com 4 fontes. A janela do próprio Gameplay aparece na lista e precisa ser escondida.

**O fluxo:** o `getDisplayMedia()` do renderer não aceita "use esta fonte"; quem responde é o handler do main. Por isso o renderer avisa o main da escolha (`capture:select-source`) logo antes de chamar o `getDisplayMedia`, e o handler responde com ela. A escolha vale uma vez e expira.

| Onde | Seção "O que compartilhar" do diálogo | Ao iniciar |
|---|---|---|
| Navegador | Os três tipos de hoje (tela, janela, aba) | Seletor do navegador |
| Desktop, Windows e X11 | Grade de telas e janelas com miniatura, nome e ícone | Captura a fonte escolhida, sem seletor do sistema |
| Desktop, Wayland | Aviso de que o sistema vai perguntar | Portal do sistema, como hoje |

O restante do diálogo (áudio, qualidade, modo, iniciar) é igual nos três casos.

## Escopo
**Fatia 1: contrato e main**
- `packages/desktop-bridge`: canais `capture:can-list` (boolean), `capture:list-sources` (lista de `{ id, name, kind, thumbnail, appIcon }`, imagens em data URL) e `capture:select-source` (id ou null).
- `apps/desktop/src/main/modules/capture/`: porta `CaptureSourceProvider`, provider do Electron (`desktopCapturer`, janelas do próprio app fora da lista), service (lista com telas primeiro, guarda a escolha de uma captura com validade curta), handlers, fake em `test/` e specs.
- `display-media-handler.ts` usa o service: com escolha, responde com ela; sem, mantém o comportamento de hoje (portal no Wayland).
- `canList` é verdadeiro no Windows e no Linux fora do Wayland.

**Fatia 2: plataforma e client**
- `desktop-platform.ts`: `capabilities.listSources` vindo do main, `capture.listSources` pelo canal e `capture.start` avisando o main antes do `getDisplayMedia`.
- `ShareSession` e `shareController` passam o `sourceId` até a plataforma (hoje fixo em `null`).
- ViewModel do painel de compartilhar: lista as fontes ao abrir o diálogo (e no botão de atualizar), guarda a escolhida fora das preferências salvas (os ids não valem entre execuções), escolhe a primeira tela por padrão e deriva `settings.source` do tipo da fonte.
- View `ShareSourcePickerView` (uma por arquivo) com stories, e o diálogo escolhendo entre os três modos da tabela. i18n em inglês e português.

## Fora do escopo
Áudio do sistema e por processo no Windows (DESK-09). Lembrar a escolha entre lives (`restoreToken`, decisão de 2026-10-28: fora). macOS.

## Checklist
- [ ] Contrato do bridge com os três canais `capture:*`, com specs
- [ ] Módulo `capture` no main: porta, provider, service, handlers, fake, specs
- [ ] Handler do `getDisplayMedia` usa a escolha; sem escolha, o comportamento anterior
- [ ] Janela do próprio app fora da lista
- [ ] `desktop-platform.ts` com `listSources` e aviso antes da captura
- [ ] `sourceId` passa por `ShareSession` e `shareController`, com specs
- [ ] ViewModel com a escolha, a atualização e o padrão, com specs
- [ ] `ShareSourcePickerView` e diálogo nos três modos, com stories e testes de interação
- [ ] i18n em inglês e português
- [ ] `npm run typecheck`, `lint`, `format:check` e `npm test` verdes
- [ ] Conferido na VM Windows: a lista abre, a escolha é a que captura, a janela do app não aparece
- [ ] Conferido no Wayland (máquina do usuário): o aviso aparece e o portal continua funcionando

## Suposições
- *(suposição)* No Linux, Wayland é detectado por `XDG_SESSION_TYPE=wayland` ou `WAYLAND_DISPLAY`. Um app forçado a X11 dentro de uma sessão Wayland só enxerga as janelas do XWayland; tratado como Wayland.
- *(suposição)* A escolha expira em 10 s: tempo de sobra entre o aviso e o `getDisplayMedia`.
- *(suposição)* Miniaturas em JPEG de 320 px de largura, qualidade 70, para a lista caber em poucas dezenas de KB.
- *(suposição)* Se a fonte escolhida some antes da captura (janela fechada), o `getDisplayMedia` falha e o fluxo atual de erro de início se aplica.
