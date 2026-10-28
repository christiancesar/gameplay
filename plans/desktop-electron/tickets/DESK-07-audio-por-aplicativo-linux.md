# DESK-07 · Áudio por aplicativo no Linux (venmic e PipeWire)

> Pontos: 8 · Depende de: DESK-06 · Branch `feature/desktop-app-audio`, saída da `dev` (depois do merge da PR do DESK-05 e DESK-06; até lá, na mesma branch)

## Contexto
`../02-tech-plan.md`, seções 3.3 e 3.4. O browser só entrega áudio de uma aba no Linux. No Electron, o vídeo da janela ou da tela já vem pelo portal do sistema (Wayland) e funciona. O áudio **de um aplicativo** (o jogo, o player de música), sem o resto do sistema e sem a voz da própria call, precisa do PipeWire.

**Como funciona (conferido em 2026-10-28 na máquina do usuário):** no PipeWire cada aplicativo que toca som é um nó (`Stream/Output/Audio`) com `application.name`, `application.process.binary` e o PID. O `@vencord/venmic` (7.2.3, módulo nativo N-API com binário pré-compilado, o mesmo do Vesktop) lista esses nós (`PatchBay.list`) e liga os escolhidos a um **microfone virtual** chamado `vencord-screen-share` (`PatchBay.link`). O renderer abre esse microfone com `getUserMedia` e o devolve como a faixa de áudio da transmissão. Testado: `PatchBay.hasPipeWire()` verdadeiro e, com um `ffplay` tocando, `list()` devolveu o nó dele.

No Wayland não dá para ligar a janela escolhida no portal a um processo, então o áudio é uma **segunda escolha**: uma lista de aplicativos que estão tocando som, no diálogo de compartilhar.

## Escopo
**Fatia 1: main, contrato e empacotamento (sem tela)**
- `packages/desktop-bridge`: canais `audio:available` (boolean), `audio:list-apps` (lista de `{ name, binary }`), `audio:share` (`{ mode: 'apps', apps: string[] }` ou `{ mode: 'system' }`) e `audio:stop`.
- `apps/desktop/src/main/modules/audio/`: porta `AppAudioProvider` (`available`, `list`, `share`, `stop`), provider `venmic` (o `PatchBay` carregado sob demanda: sem PipeWire ou sem o módulo, `available` é falso e nada quebra), service (valida, tira o próprio app da lista e do modo sistema, limpa ao sair), handlers e fake em `test/`.
- Empacotamento: `@vencord/venmic` externo no Vite do main, copiado para o app empacotado (`packageAfterCopy`) com `asar.unpack` dos `.node`.

**Fatia 2: client e plataforma**
- `Platform.capabilities.appAudio`; `Platform.capture.listAudioApps()` e `capture.stop(handle)`; `CaptureRequest.audioApps`.
- Plataforma do desktop: com apps escolhidos, pede o vídeo ao `getDisplayMedia` **sem áudio**, manda o `audio:share`, abre o microfone virtual (`getUserMedia`, sem cancelamento de eco, ruído nem ganho) e põe a faixa no mesmo `MediaStream`; ao parar, desliga a ligação (`audio:stop`).
- `ShareSettings.audioApps`; no diálogo de compartilhar, com `appAudio`, o botão de áudio vale para qualquer fonte e mostra a lista de aplicativos (marcar um ou mais, atualizar a lista); sem nenhum marcado, a transmissão sai sem áudio.
- View nova com stories, ViewModel com specs, i18n em inglês e português.

## Fora do escopo
Seletor próprio de janelas e telas (DESK-08). Windows e macOS (DESK-09). Controle de volume por aplicativo. Capturar a voz de quem assiste.

## Checklist
- [x] Contrato do bridge com os quatro canais `audio:*`, com specs
- [x] Módulo `audio` no main: porta, provider venmic, service, handlers, fake, specs
- [x] `venmic` empacotado (externo, copiado, `.node` fora do asar) e funcionando no app empacotado
- [x] `capabilities.appAudio`, `listAudioApps`, `capture.stop` e `audioApps` na `Platform`, com a implementação do web e do desktop
- [x] Plataforma do desktop: vídeo sem áudio, microfone virtual, faixa no stream, limpeza ao parar
- [x] `ShareSettings.audioApps` e a regra "sem app marcado, sem áudio"
- [x] View da lista de aplicativos no diálogo, com stories; ViewModel com specs
- [x] i18n em inglês e português
- [x] Commit a cada passo verde

## Checklist de validação
- [x] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes
- [x] No app empacotado, com um aplicativo tocando (`ffplay` com um tom): `audio:list-apps` o lista, `audio:share` cria o microfone virtual e o renderer lê nível de áudio acima de zero; sem o aplicativo marcado, o nível é zero
- [x] O próprio app (a call) não aparece na lista nem entra no áudio compartilhado
- [x] Fechar a transmissão desliga a ligação (o microfone virtual some)
- [x] Sem PipeWire (coberto pelos specs do provider e do service; não testado numa máquina sem PipeWire) (ou com o módulo ausente), `audio:available` é falso, o diálogo não mostra a lista e o resto funciona
- [ ] No Wayland do usuário: escolher a janela no portal, marcar o aplicativo e ouvir o áudio no outro lado (manual)
- [x] Web sem regressão (testes e Cypress de transmissão)

## Critério de aceite
No app instalado, quem transmite escolhe uma janela e um ou mais aplicativos, e quem assiste ouve só o áudio deles, sem o resto do sistema e sem a voz da call.

## Notas da execução (2026-10-28)

O que foi feito, na mesma branch `feature/desktop-app` (a PR do DESK-05 e do DESK-06 ainda não tinha sido aberta):
- **Contrato:** canais `audio:available`, `audio:list-apps`, `audio:share` (`apps` ou `system`) e `audio:stop`, com schemas e specs.
- **Main:** módulo `audio` (porta `AppAudioProvider`, provider `venmic`, service, handlers e fake; 18 testes). O `PatchBay` é carregado sob demanda; sem PipeWire ou sem o módulo, tudo responde "não". O app nunca aparece na lista nem entra no áudio (excluído pelo nome do binário). O `venmic` fica externo ao bundle do main e é copiado para o pacote (`packageAfterCopy`, com o `pkg-prebuilds` que ele precisa), com os `.node` fora do asar; `optionalDependencies`, porque é só Linux.
- **Client:** `Platform` ganhou `appAudio`, `listAudioApps`, `capture.stop` e `CaptureRequest.audioApps`. `ShareSettings.audioApps`, `AudioSupport` `apps` e a regra "sem aplicativo marcado, sem áudio" no ViewModel (8 testes novos). No diálogo, a lista de aplicativos (atualizar, e "não está tocando agora" para o que foi marcado antes), com 3 stories e i18n em inglês e português. Configurações salvas antes de existir `audioApps` continuam abrindo.
- **Plataformas:** o web devolve `appAudio` falso, lista vazia e `stopScreen`. O desktop pede o vídeo sem áudio, manda `audio:share`, espera o microfone virtual aparecer (até 3 s), abre-o sem cancelamento de eco, ruído nem ganho e põe a faixa no mesmo stream; ao parar, derruba a ligação (o main também derruba ao sair do app).
- **Organização do `main/`** (pedido do usuário): `lib/` (o que é do Electron: janela, protocolo, navegação, permissões, ipc), `utils/` (funções puras: URL do app, caminho de arquivo, `/uploads`, CSP) e `modules/` (cada recurso com seus handlers, services e providers).
- **Também:** o `tsconfig.json` do desktop virou um arquivo de solução (`tsc -b`), o que corrigiu o erro do editor com `import './index.css'` (TS2882) no renderer. No Storybook, nada anima em navegador automatizado (`navigator.webdriver`): as histórias de diálogo e menu competiam com a animação de entrada quando a máquina estava ocupada. Com isso, 3 rodadas seguidas dos 1277 testes do client passaram.

Validação:
- Typecheck, lint, format e `npm test` verdes: client 183 arquivos e 1277 testes, desktop 8 arquivos e 29, ponte 9, web 5, API 375. Cypress `screen-share` e `voice` do web: 9 de 9.
- No app **empacotado**, com PipeWire de verdade e um tom tocando: `audio:list-apps` lista os aplicativos e não o app; `audio:share` cria o microfone virtual e o renderer lê nível 0,0887 (o esperado de um seno de 440 Hz); marcando um aplicativo que não existe o nível é 0; depois de `audio:stop` o microfone some. O `audio:share` inválido (lista vazia) é recusado.
- Fluxo pela interface (diálogo, marcar o aplicativo, transmitir): a lista aparece, o aviso de "nenhum aplicativo" some ao marcar, o painel mostra "With sound", o microfone virtual tem nível 0,0887 durante a transmissão e some ao parar, sem erro de página.

Suposições e pontos em aberto:
- *(suposição)* **Transmissão intermitente no teste automatizado:** em algumas rodadas do script (tela virtual, microfone da call sintético) a transmissão não chegava a "iniciada" em 15 s. Não consegui reproduzir de forma confiável nem separar do ambiente de teste. Num período da sessão o Chromium chegou a ler zero de qualquer microfone, até o padrão, e depois voltou ao normal sozinho. **A conferência que decide é a do usuário, no Wayland real** (item abaixo).
- Pendente: **no Wayland do usuário**, escolher a janela no portal, marcar o aplicativo e ouvir o áudio do outro lado (manual).
- *(suposição)* O modo `system` (tudo menos o app) existe no contrato e no provider, mas **não tem tela**: o diálogo só oferece aplicativos escolhidos.
- *(suposição)* A seleção é por `application.name`, o nome que o PipeWire dá ao aplicativo: um navegador com várias abas aparece como um aplicativo só.
