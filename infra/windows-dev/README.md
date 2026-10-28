# VM Windows para o app desktop

Roda um Windows 10 LTSC dentro do Docker (QEMU + KVM) para abrir e testar o instalador do `apps/desktop` sem dar boot no Windows. Só desenvolvimento. O build de produção para Windows sai do GitHub Actions.

## Uso

```bash
cd infra/windows-dev
docker compose up -d
```

Na primeira vez ele baixa a ISO (~4,6 GB) e instala sozinho, leva uns 10 a 20 minutos. Acompanhe em http://localhost:8006. Depois disso a VM sobe em menos de um minuto.

- Tela: http://localhost:8006 (navegador) ou RDP em `localhost:3389` (usuário `dev`, senha `dev`).
- A pasta `apps/desktop/out/make` aparece dentro do Windows como `Z:`. Jogue o instalador ou o zip ali e rode.
- Desligar: `docker compose down` (espera o Windows fechar). O disco fica em `infra/windows-dev/storage/` (esparso, até 40 GB).
- Recomeçar do zero: `docker compose down && rm -rf storage`.

## Gerar o build para testar

O empacotamento do Windows roda no Linux, sem Wine:

```bash
cd apps/desktop
npx electron-forge package --platform win32 --arch x64
```

Sai `apps/desktop/out/gameplay-win32-x64/`. Na VM, copie a pasta de `Z:` para `C:\` e abra `C:\gameplay-win32-x64\gameplay.exe`. Rodar direto de `Z:` não funciona: ela é um compartilhamento de rede e o app abre e fecha na hora.

O `Setup.exe` do Squirrel sai com `npx electron-forge make --platform win32 --arch x64 --targets @electron-forge/maker-squirrel` (precisa de `wine` e `mono-complete` no Linux). Também copie para `C:\` antes de executar.

O `VITE_SERVER_URL` precisa ser uma origem sem barra no final (`https://gameplay.oikos.company`). Com a barra o empacotamento recusa.

O instalador Squirrel (`Setup.exe`) é feito no CI, em runner Windows. No Linux só sai com Wine e Mono instalados.
