# VM Windows para o app desktop

Roda um Windows 10 LTSC dentro do Docker (QEMU + KVM) para abrir e testar o instalador do `apps/desktop` sem dar boot no Windows. Só desenvolvimento. O build de produção para Windows sai do GitHub Actions.

## Uso

```bash
npm run windows-dev:up    # starts the VM
npm run windows-dev:rdp   # opens it over RDP (needs freerdp3-x11), with sound and microphone
npm run windows-dev:down  # shuts it down
```

Na primeira vez ele baixa a ISO (~4,6 GB) e instala sozinho, leva uns 10 a 20 minutos. Acompanhe em http://localhost:8006. Depois disso a VM sobe em menos de um minuto.

- Tela: `npm run windows-dev:rdp` (recomendado, bem mais fluido) ou http://localhost:8006 no navegador, que serve para acompanhar a instalação. Usuário `dev`, senha `dev`.
- A pasta `apps/desktop/out` aparece dentro do Windows como `Z:`. Copie o que quiser testar para `C:\` e rode de lá.
- Desligar: `npm run windows-dev:down` (espera o Windows fechar). O disco fica em `infra/windows-dev/storage/` (esparso, até 40 GB).
- Recomeçar do zero: `docker compose down && rm -rf storage`.

## Acesso por SSH (logs e comandos)

A VM sobe com OpenSSH, só por chave, na porta `2222` do seu localhost. O `install.bat` da pasta `oem/` roda no fim da **primeira instalação** (o dockur copia a pasta para `C:\OEM`): instala o OpenSSH, autoriza a chave, liga o logon automático do `dev` e impede o bloqueio de tela. O log do provisionamento fica em `C:\OEM\provision.log`.

```bash
npm run windows-dev:up                        # gera a chave (infra/windows-dev/ssh/, ignorada pelo git) e sobe a VM
npm run windows-dev:ssh                       # shell no Windows (PowerShell)
npm run windows-dev:ssh -- 'Get-Content $env:APPDATA\Gameplay\logs\main.log -Tail 50'
```

Sessão SSH roda sem desktop: um app aberto por ela não abre janela nem captura tela. Para rodar o app na sessão da tela (precisa do logon automático, ou de você logado no RDP):

```bash
npm run windows-dev:ssh -- 'C:\OEM\run-interactive.ps1 -Program C:\gameplay-win32-x64\gameplay.exe'
npm run windows-dev:ssh -- 'C:\OEM\run-interactive.ps1 -Program powershell.exe -Arguments "-File C:\OEM\screenshot.ps1"'
scp -P 2222 -i infra/windows-dev/ssh/id_ed25519 dev@localhost:C:/OEM/screenshot.png .
```

Numa VM que já estava instalada, o `install.bat` não roda sozinho. Ou recomece do zero (`windows:down` e `rm -rf infra/windows-dev/storage`), ou aplique à mão: copie `oem/` para `apps/desktop/out/oem` e, no PowerShell como administrador dentro do Windows, rode `powershell -ExecutionPolicy Bypass -File Z:\oem\provision.ps1`. O script copia a pasta para `C:\OEM` e libera a execução de `.ps1` na máquina.

Dicas para quem manda comandos por SSH:

- A pasta do host (`apps/desktop/out`) é `\\host.lan\Data`. Na sessão SSH a letra `Z:` não existe; use a UNC (`robocopy \\host.lan\Data\gameplay-win32-x64 C:\gameplay-test /MIR`).
- Aspas se perdem no caminho do `npm run`. Para comandos com aspas, mande por entrada padrão: `bash infra/windows-dev/ssh.sh <<'EOF' ... EOF`.
- O app abre de `C:\`, nunca de `Z:`.
- A ISO é de avaliação ("Windows License is expired" na tela): o Windows pode reiniciar sozinho de tempos em tempos.

## Áudio e microfone

O dockur não tem placa de som: o `AUDIO: "Y"` do compose manda só a saída (som) para o visualizador web, em Settings, Advanced, Audio. Microfone não passa pelo navegador. Para testar voz, use o `npm run windows-dev:rdp`, que redireciona o microfone do seu Linux. Precisa do cliente: `sudo apt install -y freerdp3-x11`.

O Windows passa a ter "Remote Audio" como saída e entrada. O app só vê o microfone dentro dessa sessão RDP.

## Gerar o build para testar

O empacotamento do Windows roda no Linux, sem Wine:

```bash
cd apps/desktop
npx electron-forge package --platform win32 --arch x64
```

Sai `apps/desktop/out/gameplay-win32-x64/`. Na VM, copie a pasta de `Z:` para `C:\` e abra `C:\gameplay-win32-x64\gameplay.exe`. Rodar direto de `Z:` não funciona: ela é um compartilhamento de rede e o app abre e fecha na hora.

O `Setup.exe` do Squirrel sai com `npx electron-forge make --platform win32 --arch x64` (em `apps/desktop`; sem `--targets`, que faz o Forge ignorar o `name` e o `setupIcon` do `forge.config.ts` e o instalador sai com o ícone do Squirrel) (precisa de `wine` e `mono-complete` no Linux). Também copie para `C:\` antes de executar.

O `VITE_SERVER_URL` precisa ser uma origem sem barra no final (`https://gameplay.oikos.company`). Com a barra o empacotamento recusa.

O instalador Squirrel (`Setup.exe`) é feito no CI, em runner Windows. No Linux só sai com Wine e Mono instalados.
