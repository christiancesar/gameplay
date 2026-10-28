# VM Windows para o app desktop

Roda um Windows 10 LTSC dentro do Docker (QEMU + KVM) para abrir e testar o instalador do `apps/desktop` sem dar boot no Windows. Só desenvolvimento. O build de produção para Windows sai do GitHub Actions.

## Uso

```bash
npm run windows:up    # starts the VM
npm run windows:rdp   # opens it over RDP (needs freerdp3-x11), with sound and microphone
npm run windows:down  # shuts it down
```

Na primeira vez ele baixa a ISO (~4,6 GB) e instala sozinho, leva uns 10 a 20 minutos. Acompanhe em http://localhost:8006. Depois disso a VM sobe em menos de um minuto.

- Tela: `npm run windows:rdp` (recomendado, bem mais fluido) ou http://localhost:8006 no navegador, que serve para acompanhar a instalação. Usuário `dev`, senha `dev`.
- A pasta `apps/desktop/out` aparece dentro do Windows como `Z:`. Copie o que quiser testar para `C:\` e rode de lá.
- Desligar: `npm run windows:down` (espera o Windows fechar). O disco fica em `infra/windows-dev/storage/` (esparso, até 40 GB).
- Recomeçar do zero: `docker compose down && rm -rf storage`.

## Áudio e microfone

O dockur não tem placa de som: o `AUDIO: "Y"` do compose manda só a saída (som) para o visualizador web, em Settings, Advanced, Audio. Microfone não passa pelo navegador. Para testar voz, use o `npm run windows:rdp`, que redireciona o microfone do seu Linux. Precisa do cliente: `sudo apt install -y freerdp3-x11`.

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
