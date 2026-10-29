# 00 · Requisitos: diagnóstico modular do desktop

> Data: 2026-10-29. Status: planejamento detalhado para uma próxima atualização. Implementação pendente.

## Objetivo

Centralizar a coleta e a consulta de diagnósticos do Electron, principalmente no processo `main`, com módulos e dependências explícitas. Permitir ativar CDP, inspector do processo `main`, coletor local e, futuramente, um servidor MCP local para inspecionar o app. Evitar espalhar serialização, destinos de logs e condicionais de ambiente pelos serviços da aplicação.

## Requisitos

- Receber eventos tipados de áreas como captura, SFU, áudio, rede e ciclo de vida da janela. Cada evento deve ter horário, categoria, identificador de correlação quando aplicável e somente campos necessários para diagnosticar o problema.
- Separar a emissão de eventos, o armazenamento local temporário e os adaptadores de consulta. O mesmo evento pode alimentar uma visão local, CDP ou MCP sem formatos específicos desses protocolos dentro dos módulos de negócio.
- Montar o módulo no `main` com injeção explícita de dependências, seguindo o padrão de `create*Module` já presente no projeto. Não introduzir um contêiner de DI para a aplicação inteira sem necessidade demonstrada.
- Oferecer controles independentes para DevTools, porta CDP, inspector do `main`, coletor e inspeção programática por janela. A porta CDP precisa ser decidida antes de `app.ready`; outros coletores podem ser ligados e desligados por sessão quando a API permitir.
- Permitir configuração explícita por argumentos de inicialização, sem ativar diagnósticos por padrão. O contrato inicial deve contemplar `--diagnostics`, `--cdp-port=<porta>` e `--main-inspect-port=<porta>`. O MCP terá ativação exclusiva pelo painel administrativo local.
- Manter todas as consultas locais. Nenhum CDP, inspector ou MCP deve escutar na internet aberta ou ser ativado por uma configuração remota do servidor self-hosted.
- Exibir no painel administrativo uma aba **Desenvolvimento**, com o estado de diagnóstico, CDP, inspector, DevTools, as portas locais ativas e a documentação de ativação. Sem argumentos, os recursos aparecem desligados.
- Exibir uma aba administrativa separada chamada **MCP**, responsável pelo estado, ativação, configuração local e encerramento do servidor MCP. Essa ação só acontece dentro do painel do desktop e não pode ser disparada pelo servidor self-hosted.
- Manter a documentação operacional em um único conteúdo MDX, renderizado no painel e versionado junto ao client.
- Tratar MCP como servidor local opcional que consulta os mesmos dados estruturados. MCP não vem ativado automaticamente pelo Electron ou pelo Chromium. Começar com recursos e ferramentas somente de leitura, com escopo e transporte definidos no ticket próprio.
- Preservar o limite MVVM: regras e Views não conhecem Electron nem MCP. O client compartilhado usa uma porta de diagnóstico quando precisar informar eventos de domínio; cada host decide o destino.
- Não gravar nem encaminhar logs em builds de produção, conforme decisão do usuário. Isso inclui o arquivo `main.log`, os logs de console do renderer, os eventos verbosos de captura e o encaminhamento de logs ao Sentry. Auditar separadamente qualquer SDK que registre logs por conta própria. Erros e métricas de telemetria têm política própria, a decidir antes da implementação _(suposição)_.
- Validar o modo de produção por testes que comprovem ausência de arquivo, saída de console, encaminhamento e endpoints de depuração, sem depender de banco ou e2e de API.

## Estado atual que motivou o plano

- `apps/desktop/src/main/main.ts` deve abrir CDP somente quando `--cdp-port=<porta>` for passado, sempre em `127.0.0.1`.
- `apps/desktop/src/main/lib/window.ts` deve abrir DevTools somente quando `--devtools` for passado junto com `--diagnostics`. Um pacote empacotado não ativa esses recursos apenas por estar em desenvolvimento.
- O diagnóstico de screen share deve usar a porta estruturada do host, sem `console.warn` nem serialização JSON manual no `share-session.service.ts`.
- `apps/desktop/src/main/modules/logging/error-capture.ts` recolhe o console do renderer. `logging.module.ts` cria `main.log` em qualquer ambiente e grava de `info` para cima. `main.ts` também envia esses logs ao Sentry se ele estiver configurado.

## Fora do escopo deste plano

- Habilitar inspeção remota pela internet ou por comandos recebidos do servidor self-hosted.
- Ativar o MCP automaticamente por argumento, serviço do sistema ou inicialização do desktop.
- Criar abas de navegação dentro do desktop para capturar páginas externas.
- Expor cookies, tokens, áudio, vídeo, SDP ou endereços privados nos dados de diagnóstico.
- Transformar toda a aplicação em POO ou migrar os módulos de domínio para um framework de DI.
- Implementar a mudança agora. A prioridade imediata é a verificação da release de produção indicada em `tickets/DIAG-01-release-sem-logs.md`.
