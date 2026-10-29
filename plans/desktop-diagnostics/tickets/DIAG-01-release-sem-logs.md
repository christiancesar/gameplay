# DIAG-01 · Release sem logs

> Status: concluído. Prioridade: obrigatório antes de gerar e distribuir o próximo build de produção.

## Escopo

- Auditar `main`, renderer, preload, helper de áudio, logger e configuração do Sentry para identificar escrita de logs em produção.
- Manter um `main.log` local, limitado e rotacionado para contexto mínimo, mas desligar o espelhamento detalhado do console do renderer, os diagnósticos detalhados de captura e o encaminhamento de linhas de log ao Sentry quando `VITE_APP_ENV=production`.
- Garantir que CDP, DevTools e qualquer MCP permaneçam desativados no build de produção, inclusive se o app estiver empacotado.
- Manter a semântica funcional da aplicação. Exceções e métricas de telemetria continuam independentes dos logs de aplicação _(suposição confirmada na implementação)_.
- Testar a configuração de produção e conferir o artefato gerado. Não depender de banco nem e2e de API.

## Checklist

- [x] Política de logs de produção definida e aplicada em todos os processos do app
- [x] Arquivo `main.log` mínimo, limitado e local, sem logs detalhados no console nem envio de logs ao Sentry em produção
- [x] Sem porta CDP, DevTools ou servidor MCP no build de produção
- [x] Testes de política e verificação do pacote de produção passam
- [x] Notas da execução e suposições registradas antes de liberar a release

## Critério de aceite

Iniciar um pacote de produção, reproduzir uma sessão e verificar que não houve criação de arquivo de log, emissão de diagnóstico nem envio de logs. Se algum caminho ainda emitir, a release permanece bloqueada.

## Notas da execução

- O `main.log` continua ativo em produção como registro mínimo local. O Pino mantém a rotação de até quatro arquivos de 5 MiB, evitando crescimento ilimitado e mantendo o custo de escrita baixo.
- O espelhamento do console do renderer fica desligado em produção. O stream Pino que encaminhava logs ao Sentry também não é conectado em produção. A telemetria do renderer recebe `logs: false` nesse ambiente e mantém erros e métricas disponíveis.
- A política existente para CDP e DevTools continua restrita a `VITE_APP_ENV=development`; este ticket não criou MCP nem alterou sua ativação futura pelo painel administrativo.
- Foram adicionados testes para o logger desabilitado, captura seletiva do console do renderer, configuração de telemetria e bloqueio de logs no provider Sentry.
- O pacote Linux de produção foi gerado em `apps/desktop/out/gameplay-linux-x64`. Executado em Xvfb com configuração isolada por 8 segundos: criou somente o arquivo local esperado de contexto, não produziu stdout da aplicação e não abriu as portas 9223 ou 9229. Os arquivos de cache e sessão criados pelo Chromium não são logs da aplicação.
- *(suposição)* Logs nativos do Chromium, Crashpad e caches internos do Electron não fazem parte dos logs de aplicação controlados por este ticket; exceções, crashes nativos e métricas permanecem na telemetria operacional.
- O `format:check` geral do client continua bloqueado por um arquivo preexistente e não relacionado, `packages/client/src/modules/screen-share/model/services/screen-share-debug.ts`. Os arquivos alterados passaram no format check isolado.
