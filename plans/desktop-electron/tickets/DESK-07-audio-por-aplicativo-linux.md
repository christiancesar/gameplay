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
- [ ] Contrato do bridge com os quatro canais `audio:*`, com specs
- [ ] Módulo `audio` no main: porta, provider venmic, service, handlers, fake, specs
- [ ] `venmic` empacotado (externo, copiado, `.node` fora do asar) e funcionando no app empacotado
- [ ] `capabilities.appAudio`, `listAudioApps`, `capture.stop` e `audioApps` na `Platform`, com a implementação do web e do desktop
- [ ] Plataforma do desktop: vídeo sem áudio, microfone virtual, faixa no stream, limpeza ao parar
- [ ] `ShareSettings.audioApps` e a regra "sem app marcado, sem áudio"
- [ ] View da lista de aplicativos no diálogo, com stories; ViewModel com specs
- [ ] i18n em inglês e português
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes
- [ ] No app empacotado, com um aplicativo tocando (`ffplay` com um tom): `audio:list-apps` o lista, `audio:share` cria o microfone virtual e o renderer lê nível de áudio acima de zero; sem o aplicativo marcado, o nível é zero
- [ ] O próprio app (a call) não aparece na lista nem entra no áudio compartilhado
- [ ] Fechar a transmissão desliga a ligação (o microfone virtual some)
- [ ] Sem PipeWire (ou com o módulo ausente), `audio:available` é falso, o diálogo não mostra a lista e o resto funciona
- [ ] No Wayland do usuário: escolher a janela no portal, marcar o aplicativo e ouvir o áudio no outro lado (manual)
- [ ] Web sem regressão (testes e Cypress de transmissão)

## Critério de aceite
No app instalado, quem transmite escolhe uma janela e um ou mais aplicativos, e quem assiste ouve só o áudio deles, sem o resto do sistema e sem a voz da call.
