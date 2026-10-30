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
- [x] Auxiliar nativo compilando com `mingw-w64`, saindo quando a entrada padrão fecha
- [x] Auxiliar empacotado no app do Windows
- [x] Canais `system-audio:*` e evento `system-audio:pcm` no bridge, com specs
- [x] Módulo `system-audio` no main: porta, provider, service, handlers, fake, specs
- [x] Faixa de áudio do PCM na página (worklet), sem tocar no alto-falante
- [x] `capture.start` e `capture.stop` do desktop com o áudio do sistema
- [x] `systemAudioWithoutApp` e `systemWithoutApp` no client, com specs e stories
- [x] i18n em inglês e português
- [x] `npm run typecheck`, `lint`, `format:check` e `npm test` verdes
- [x] Conferido na VM Windows: só o som externo chega, as vozes do app não, e o auxiliar some ao parar

## Suposições
- *(suposição)* Formato fixo do PCM: s16le, 48 kHz, estéreo. O `AUTOCONVERTPCM` da WASAPI converte o que for preciso.
- *(suposição)* Excluir o PID do processo main cobre os processos filhos do Chromium, inclusive o serviço de áudio.
- *(suposição)* Se o auxiliar falhar ao iniciar, a transmissão sai sem áudio e o aviso "sem áudio" que já existe aparece.

## Notas da execução
- Quatro commits: auxiliar e empacotamento (`9666ee9`), bridge e main (`ac9a6e2`), client (`f17f9dc`) e a correção do CSP e do sinal de início (último commit).
- **Conferido na VM Windows 10 (build 19044), no app empacotado, ponta a ponta** (auxiliar, evento de PCM, worklet e faixa): com 880 Hz tocando em outro processo e 440 Hz tocando dentro do app (as vozes), a faixa trouxe **880 Hz a -38 dB e 440 Hz a -158 dB**, que é o nível do ruído de fundo (-153 dB). O auxiliar fica em 1 processo durante a captura, 0 depois do stop e 0 depois de matar o app sem aviso.
- **Dois defeitos achados nessa conferência, já corrigidos:** (1) o Vite embutia o worklet como `data:text/javascript;base64,...`, que o CSP (`script-src 'self'`) bloquearia; a importação passou a `?url&no-inline`, e o worklet sai como arquivo próprio. (2) A mensagem "capturing" do auxiliar não chegava ao `stderr` em pipe dentro de 3 s e o provider matava o auxiliar; agora o auxiliar dá `fflush` e o primeiro PCM recebido também conta como início.
- **Não conferido:** o diálogo na tela com o interruptor de áudio (exige login e call), e áudio de verdade na transmissão para outro participante. A VM não tem como ouvir o resultado. A latência (50 a 100 ms prevista) não foi medida.
- O modo por evento da WASAPI falha na build 19044 (`0x88890021`); o auxiliar usa só polling. Numa máquina com Windows 11 o modo por evento pode funcionar, mas não foi preciso.
- O auxiliar é compilado no `prePackage` do Forge quando o alvo é Windows e exige `mingw-w64` (`sudo apt install mingw-w64`). O workflow `desktop-release.yml` hoje só gera Linux, então não precisa mudar; o job do Windows (DESK-12) vai precisar do `mingw-w64` ou de um MSYS2.
- *(suposição)* PCM s16le, 48 kHz, estéreo; excluir o PID do processo main cobre os filhos do Chromium (confirmado pelo teste: o tom tocado dentro do app saiu).
- *(suposição)* Se o auxiliar não inicia, a transmissão sai sem áudio e o aviso "sem áudio" que já existe aparece.
- *(suposição)* O diálogo mostra o texto "o som do computador, sem a call" no Windows, e o interruptor de áudio vale para qualquer fonte (tela ou janela), pois o áudio é do computador todo menos o app.
