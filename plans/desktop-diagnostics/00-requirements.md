# 00 · Requisitos: diagnóstico modular do desktop

> Data: 2026-10-28. Status: planejamento para uma próxima atualização. Implementação pendente.

## Objetivo

Centralizar a coleta e a consulta de diagnósticos do Electron, principalmente no processo `main`, com módulos e dependências explícitas. Permitir ativar CDP e, futuramente, um servidor MCP local para inspecionar o app durante o desenvolvimento. Evitar espalhar serialização, destinos de logs e condicionais de ambiente pelos serviços da aplicação.

## Requisitos

- Receber eventos tipados de áreas como captura, SFU, áudio, rede e ciclo de vida da janela. Cada evento deve ter horário, categoria, identificador de correlação quando aplicável e somente campos necessários para diagnosticar o problema.
- Separar a emissão de eventos, o armazenamento local temporário e os adaptadores de consulta. O mesmo evento pode alimentar uma visão local, CDP ou MCP sem formatos específicos desses protocolos dentro dos módulos de negócio.
- Montar o módulo no `main` com injeção explícita de dependências, seguindo o padrão de `create*Module` já presente no projeto. Não introduzir um contêiner de DI para a aplicação inteira sem necessidade demonstrada.
- Oferecer controles independentes para DevTools, porta CDP e inspeção programática por janela. A porta CDP precisa ser decidida antes de `app.ready`; outros coletores podem ser ligados e desligados por sessão quando a API permitir.
- Tratar MCP como servidor local opcional que consulta os mesmos dados estruturados. MCP não vem ativado automaticamente pelo Electron ou pelo Chromium. Começar com recursos e ferramentas somente de leitura, com escopo e transporte definidos no ticket próprio.
- Preservar o limite MVVM: regras e Views não conhecem Electron nem MCP. O client compartilhado usa uma porta de diagnóstico quando precisar informar eventos de domínio; cada host decide o destino.
- Não gravar nem encaminhar logs em builds de produção, conforme decisão do usuário. Isso inclui o arquivo `main.log`, os logs de console do renderer, os eventos verbosos de captura e o encaminhamento de logs ao Sentry. Auditar separadamente qualquer SDK que registre logs por conta própria. Erros e métricas de telemetria têm política própria, a decidir antes da implementação _(suposição)_.
- Validar o modo de produção por testes que comprovem ausência de arquivo, saída de console, encaminhamento e endpoints de depuração, sem depender de banco ou e2e de API.

## Estado atual que motivou o plano

- `apps/desktop/src/main/main.ts` abre CDP em `127.0.0.1:9223` e registra sua ativação quando `VITE_APP_ENV=development`.
- `apps/desktop/src/main/lib/window.ts` abre DevTools automaticamente sob a mesma condição. Um pacote empacotado com `VITE_APP_ENV=development` também abre esses recursos.
- `packages/client/src/modules/screen-share/model/services/screen-share-debug.ts` usa `console.warn` e serializa JSON em desenvolvimento; `share-session.service.ts` chama esse helper em vários pontos.
- `apps/desktop/src/main/modules/logging/error-capture.ts` recolhe o console do renderer. `logging.module.ts` cria `main.log` em qualquer ambiente e grava de `info` para cima. `main.ts` também envia esses logs ao Sentry se ele estiver configurado.

## Fora do escopo deste plano

- Habilitar inspeção remota em releases públicos.
- Expor cookies, tokens, áudio, vídeo, SDP ou endereços privados nos dados de diagnóstico.
- Transformar toda a aplicação em POO ou migrar os módulos de domínio para um framework de DI.
- Implementar a mudança agora. A prioridade imediata é a verificação da release de produção indicada em `tickets/DIAG-01-release-sem-logs.md`.
