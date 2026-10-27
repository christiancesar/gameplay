# Tickets: app desktop em Electron

Base: `../02-tech-plan.md`. Uma branch por ticket, saída da `dev`, com PR de volta para a `dev`. Commit a cada passo verde. Ao terminar um ticket: checklist marcado, seção "Notas da execução" com as suposições marcadas como *(suposição)*, status atualizado aqui e `plans/PROGRESS.md` atualizado. Parar depois de cada ticket para a revisão do usuário.

Cada ticket deixa o web funcionando como hoje.

## Fase 1: migração (agora)

Pacotes divididos, web e desktop consumindo o mesmo client. Sem recursos nativos de captura: no desktop, a transmissão usa o `getDisplayMedia` padrão do Chromium.

| Ticket | Pontos | Onda | Status |
|---|---|---|---|
| DESK-01 Plano do app desktop (este diretório) | 3 | 0 | concluído |
| [DESK-02 Front-end em `packages/client`](DESK-02-packages-client.md) | 8 | 1 | pendente |
| DESK-03 Porta `Platform` no client, com a implementação browser (o `acquireScreen` de hoje) e a `FakePlatform` nos specs e stories | 3 | 2 | a detalhar |
| DESK-04 Servidor em tempo de execução e autenticação por token: `platform.server` no `http`, no socket e no Better Auth client; plugin `bearer` na API; web continua com cookie | 5 | 2 | a detalhar |
| DESK-05 `apps/desktop` com Forge e plugin Vite 8: janela, protocolo `app://`, segurança (seção 7 do tech plan), renderer montando o client e tela de escolha do servidor | 5 | 3 | a detalhar |
| DESK-06 `packages/desktop-bridge` e o IPC tipado só com os canais do app (endereço do servidor, token no `safeStorage`) | 3 | 4 | a detalhar |

## Fase 2: recursos nativos (depois, com o projeto normalizado)

Detalhada quando a fase 1 terminar.

| Ticket | O que é |
|---|---|
| DESK-07 | Captura de janela e tela no Linux (portal no Wayland, seletor nosso no X11), canais `capture:*` e `setDisplayMediaRequestHandler`. |
| DESK-08 | Áudio por aplicativo no Linux com `@vencord/venmic` e PipeWire, lista de apps tocando som. |
| DESK-09 | Windows: seletor com miniaturas, loopback do sistema e áudio por processo (WASAPI). |
| DESK-10 | Empacotamento, assinatura, atualização completa e versão mínima do app no `/api/health`. |
| DESK-11 | OTA da UI assinado, com rollback (seção 6 do tech plan). |
