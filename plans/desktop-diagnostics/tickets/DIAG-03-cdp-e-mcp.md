# DIAG-03 · Inicialização e CDP local

> Status: pendente. Depende de: DIAG-02.

## Escopo

- Criar o parser tipado dos argumentos de inicialização antes de `app.whenReady()`.
- Suportar `--diagnostics`, `--cdp-port=<porta>`, `--main-inspect-port=<porta>` e `--devtools`. O MCP não terá argumento de ativação; será controlado pelo DIAG-04.
- Criar um módulo no `main` que componha o coletor DIAG-02, CDP do Chromium, inspector do processo `main`, DevTools e `webContents.debugger`.
- Manter todos os endpoints limitados ao acesso local e desligados quando os argumentos não forem passados.
- Expor ao client uma leitura validada do estado dos diagnósticos, sem permitir que a View ou ViewModel importe Electron.
- Definir mensagens de erro para porta inválida, porta ocupada e combinação de argumentos incompatível.
- Não implementar o servidor MCP neste ticket.

## Checklist

- [ ] Parser de argumentos e política de ativação definidos
- [ ] CDP, inspector do `main`, DevTools e debugger encapsulados
- [ ] Estado local exposto por bridge tipada
- [ ] Testes de app sem argumentos e com cada combinação válida
- [ ] Build de produção sem endpoints quando nenhum argumento for passado
- [ ] Notas da execução e suposições registradas
