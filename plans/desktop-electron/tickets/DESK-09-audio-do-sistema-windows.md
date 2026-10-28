# DESK-09 · Áudio do sistema no Windows, sem o Gameplay

> Pontos: 8 · Depende de: DESK-08 · Branch `feature/desktop-windows-audio`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seção 3.3. Quem assiste já ouve as vozes da call pelo próprio app, então a transmissão **não pode levar nenhuma voz** (nem a do streamer, nem a dos integrantes): o que sai é o **áudio do sistema menos o Gameplay**. É a mesma regra do modo `system` do Linux (DESK-07).

**Por que não basta o Electron (conferido em 2026-10-28 na VM Windows 10, build 19044, Electron 45.1.0):** `audio: 'loopback'` no `setDisplayMediaRequestHandler` entrega o áudio do sistema inteiro. Com um tom de 440 Hz tocando dentro do app (as vozes) e outro de 880 Hz em outro processo, a faixa trouxe os dois. A restrição `restrictOwnAudio` do Chromium não é aplicada pelo Electron (`getSettings()` volta `restrictOwnAudio: false` e o tom do app continua passando). Além disso a faixa vem com cancelamento de eco, supressão de ruído e ganho automático ligados.

**O que funciona:** o loopback por processo da WASAPI (`ActivateAudioInterfaceAsync` com `VAD\Process_Loopback`). Prova de conceito em C++ compilado com `mingw-w64` no Linux, rodando na mesma VM (build 19044): excluir o processo de 440 Hz deixou só o de 880 Hz; incluir só o de 880 Hz, idem; e o inverso. Isolamento total (0,2995 contra 0,0000). Só o modo **polling** funciona nessa build (o modo por evento falha com `0x88890021`). A doc da Microsoft cita a build 20348 como mínimo; na 19044 funcionou.

**O desenho:**
- Um **executável auxiliar** em C++ (`gameplay-audio-capture.exe`), não um módulo N-API: independe da versão do Electron e compila sem `node-gyp`. Recebe `exclude <pid>` e escreve na saída padrão PCM s16le, 48 kHz, estéreo, até a entrada padrão fechar.
- O **main** inicia o auxiliar excluindo o próprio PID (a árvore inclui o processo de áudio do Chromium) e manda o PCM à página por um evento (`system-audio:pcm`), em pedaços de poucos milissegundos.
- A **página** toca o PCM num `AudioWorklet` ligado a um `MediaStreamAudioDestinationNode` (nunca ao alto-falante) e usa a faixa como o áudio da transmissão, sem cancelamento de eco nem ganho. Latência esperada de 50 a 100 ms.

## Escopo
**Fatia 1: auxiliar nativo e empacotamento**
- `apps/desktop/native/audio-capture/`: fonte em C++, script de build com `mingw-w64` e README. O auxiliar sai quando a entrada padrão fecha (se o app morrer, ele não fica órfão).
- `forge.config.ts`: o auxiliar entra no pacote do Windows como recurso extra; o build roda no `prePackage` quando o alvo é Windows.

**Fatia 2: contrato e main**
- `packages/desktop-bridge`: canais `system-audio:available`, `system-audio:start` e `system-audio:stop`, e o evento `system-audio:pcm` (do main para a página) com `bridge.on`.
- `apps/desktop/src/main/modules/system-audio/`: porta `SystemAudioProvider`, provider que inicia o auxiliar, service, handlers, fake e specs.

**Fatia 3: plataforma e client**
- Renderer: faixa de áudio a partir do PCM (worklet) e `capture.start` que, com áudio pedido e `systemAudioWithoutApp`, tira o áudio do `getDisplayMedia`, liga o auxiliar e põe a faixa no stream; `capture.stop` desliga tudo.
- `Platform.capabilities.systemAudioWithoutApp` e `AudioSupport` `systemWithoutApp` no diálogo, com o texto "o som do computador, sem a call", em inglês e português.

## Fora do escopo
Áudio por aplicativo no Windows, listar e incluir processos (DESK-14). macOS. Assinatura do auxiliar (DESK-12). Job `windows-latest` do release (DESK-12).

## Checklist
- [ ] Auxiliar nativo compilando com `mingw-w64`, saindo quando a entrada padrão fecha
- [ ] Auxiliar empacotado no app do Windows
- [ ] Canais `system-audio:*` e evento `system-audio:pcm` no bridge, com specs
- [ ] Módulo `system-audio` no main: porta, provider, service, handlers, fake, specs
- [ ] Faixa de áudio do PCM na página (worklet), sem tocar no alto-falante
- [ ] `capture.start` e `capture.stop` do desktop com o áudio do sistema
- [ ] `systemAudioWithoutApp` e `systemWithoutApp` no client, com specs e stories
- [ ] i18n em inglês e português
- [ ] `npm run typecheck`, `lint`, `format:check` e `npm test` verdes
- [ ] Conferido na VM Windows: só o som externo chega, as vozes do app não, e o auxiliar some ao parar

## Suposições
- *(suposição)* Formato fixo do PCM: s16le, 48 kHz, estéreo. O `AUTOCONVERTPCM` da WASAPI converte o que for preciso.
- *(suposição)* Excluir o PID do processo main cobre os processos filhos do Chromium, inclusive o serviço de áudio.
- *(suposição)* Se o auxiliar falhar ao iniciar, a transmissão sai sem áudio e o aviso "sem áudio" que já existe aparece.
