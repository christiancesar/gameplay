# Tickets: app desktop em Electron

Base: `../02-tech-plan.md`. Uma branch por ticket, saída da `dev`, com PR de volta para a `dev`. Commit a cada passo verde. Ao terminar um ticket: checklist marcado, seção "Notas da execução" com as suposições marcadas como *(suposição)*, status atualizado aqui e `plans/PROGRESS.md` atualizado. Parar depois de cada ticket para a revisão do usuário.

Cada ticket deixa o web funcionando como hoje e tem um checklist de validação com os comandos e conferências que provam isso. Os tickets da fase 1 são sequenciais.

## Fase 1: migração (agora)

Pacotes divididos, web e desktop consumindo o mesmo client. Sem recursos nativos de captura: no desktop, a transmissão usa o `getDisplayMedia` padrão do Chromium.

| Ticket | Pontos | Onda | Status |
|---|---|---|---|
| DESK-01 Plano do app desktop (este diretório) | 3 | 0 | concluído |
| [DESK-02 Front-end em `packages/client`](DESK-02-packages-client.md) | 8 | 1 | concluído |
| [DESK-03 Porta `Platform` no client](DESK-03-porta-platform.md) | 3 | 2 | concluído |
| [DESK-04 Servidor em tempo de execução e token](DESK-04-servidor-e-token.md) | 5 | 3 | concluído |
| [DESK-05 `apps/desktop` com Electron Forge](DESK-05-apps-desktop.md) | 5 | 4 | concluído |
| [DESK-06 `packages/desktop-bridge` e o IPC tipado](DESK-06-desktop-bridge.md) | 3 | 5 | concluído |

## Fase 2: recursos nativos

Ordem mudada em 2026-10-28, depois que o usuário testou o app no Wayland: escolher a janela já funciona (o portal do sistema abre o seletor dele), e o que falta é o **áudio** da transmissão. Por isso o áudio por aplicativo passou a ser o DESK-07.

| Ticket | Pontos | Status |
|---|---|---|
| [DESK-07 Áudio por aplicativo no Linux (venmic e PipeWire)](DESK-07-audio-por-aplicativo-linux.md) | 8 | concluído |
| [DESK-08 Seletor de fontes do app (X11 e Windows)](DESK-08-seletor-de-fontes.md) | 5 | concluído (falta conferir no Wayland e no diálogo) |
| [DESK-09 Windows: áudio do sistema sem o Gameplay (WASAPI)](DESK-09-audio-do-sistema-windows.md) | 8 | concluído (falta conferir o diálogo e o áudio no ar) |
| [DESK-14 Fonte e áudio por tipo de compartilhamento](DESK-14-fonte-e-audio-por-tipo.md) | 8 | concluído (falta conferir áudio no Windows e X11 numa chamada real) |
| [DESK-10 Servidor de produção embutido no build](DESK-10-servidor-embutido-no-build.md) | 3 | concluído |
| [DESK-11 Release do Linux pelo GitHub Actions](DESK-11-release-linux-github-actions.md) | 5 | concluído (`v0.0.1` publicado) |
| DESK-12 Windows: empacotamento, assinatura, atualização completa, `.ico` e versão mínima do app no `/api/health` | 5 | a detalhar |
| DESK-13 OTA da UI assinado, com rollback (seção 6 do tech plan) | 5 | a detalhar |

**Ordem decidida em 2026-10-28:** a primeira versão distribuída é só Linux (deb e zip). Por isso o DESK-10 e o DESK-11 passam na frente do DESK-08 e do DESK-09. **macOS fica fora por tempo indeterminado** (sem ticket); o que era dele no DESK-10 antigo (`.icns`, notarização, DMG) sai do plano até o usuário pedir. O DESK-12 e o DESK-13 só começam depois de uma release do Linux no ar.
