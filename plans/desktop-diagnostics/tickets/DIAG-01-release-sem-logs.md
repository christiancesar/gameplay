# DIAG-01 · Release sem logs

> Status: pendente. Prioridade: obrigatório antes de gerar e distribuir o próximo build de produção.

## Escopo

- Auditar `main`, renderer, preload, helper de áudio, logger e configuração do Sentry para identificar escrita de logs em produção.
- Desligar criação e rotação de `main.log`, espelhamento do console do renderer, emissão de diagnósticos de captura e encaminhamento de linhas de log ao Sentry quando `VITE_APP_ENV=production`.
- Garantir que CDP, DevTools e qualquer MCP permaneçam desativados no build de produção, inclusive se o app estiver empacotado.
- Manter a semântica funcional da aplicação. Tratar separadamente a política de exceções e métricas de telemetria _(suposição)_.
- Testar a configuração de produção e conferir o artefato gerado. Não depender de banco nem e2e de API.

## Checklist

- [ ] Política de logs de produção definida e aplicada em todos os processos do app
- [ ] Sem arquivo `main.log`, logs no console ou envio de logs ao Sentry em produção
- [ ] Sem porta CDP, DevTools ou servidor MCP no build de produção
- [ ] Testes de política e verificação do pacote de produção passam
- [ ] Notas da execução e suposições registradas antes de liberar a release

## Critério de aceite

Iniciar um pacote de produção, reproduzir uma sessão e verificar que não houve criação de arquivo de log, emissão de diagnóstico nem envio de logs. Se algum caminho ainda emitir, a release permanece bloqueada.
