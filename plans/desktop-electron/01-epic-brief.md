# 01 · Epic Brief: app desktop em Electron

> Data: 2026-10-27. Base: `00-requirements.md`.

## Resumo

O web já transmite tela em boa qualidade, mas o browser não deixa capturar o áudio de uma janela ou de outro aplicativo. No Linux, por exemplo, o áudio só sai quando se compartilha uma aba. Este épico cria um app desktop em Electron que roda o mesmo front-end do web e, numa segunda fase, usa recursos do sistema para capturar a janela com o áudio dela. A primeira fase só reorganiza o projeto: o front-end vira um pacote compartilhado e o desktop passa a existir rodando esse pacote.

## Contexto e problema

**Quem é afetado:** quem transmite jogo, vídeo ou música para o grupo.

**Onde dói:**
- Compartilhar um jogo sem o som dele, ou com o som do sistema inteiro misturado.
- No Linux, o áudio da transmissão só existe para aba do browser.
- Essas limitações são do browser e não têm solução no web.

## O que entrega

**Fase 1, migração:**
- `packages/client` com todo o front-end, consumido pelo `apps/web` e pelo `apps/desktop`.
- Porta `Platform` para as diferenças entre web e desktop.
- Servidor configurável e autenticação por token no desktop.
- `apps/desktop` com Electron Forge, abrindo o mesmo app do web.
- `packages/desktop-bridge` com o IPC tipado, só com os canais do próprio app.

**Fase 2, recursos nativos:**
- Captura de janela e tela no Linux, e áudio por aplicativo com `@vencord/venmic` e PipeWire.
- Windows: seletor com miniaturas, áudio do sistema e por processo.
- Empacotamento, atualização completa e OTA assinado da UI.

## Critério de sucesso

- Fase 1: o web funciona exatamente como antes e o desktop abre, entra num servidor, conversa por voz e transmite tela como o web, a partir do mesmo código.
- Fase 2: no Linux, o usuário transmite um jogo com o áudio dele, sem o resto do sistema e sem a voz da call.

## Fora do escopo

Componentes de UI separados para o desktop. UI carregada do servidor. Push-to-talk global. Mobile.

## Riscos

- **Wayland**: o app não lista as janelas de outros programas; a escolha passa pelo seletor do sistema. Muda o fluxo de escolha no Linux.
- **Áudio nativo**: depende de módulo nativo (`venmic`) e do PipeWire da máquina.
- **Autenticação**: o desktop não usa cookie de sessão; depende do plugin `bearer` do Better Auth convivendo com o 2FA e o admin.
- **Distribuição**: assinatura de código no Windows e no macOS tem custo.
