# DIAG-03 · Inicialização e CDP local

> Status: concluído. Depende de: DIAG-02.

## Escopo

- Criar o parser tipado dos argumentos de inicialização antes de `app.whenReady()`.
- Suportar `--diagnostics`, `--cdp-port=<porta>`, `--main-inspect-port=<porta>` e `--devtools`. O MCP não terá argumento de ativação; será controlado pelo DIAG-04.
- Criar um módulo no `main` que componha o coletor DIAG-02, CDP do Chromium, inspector do processo `main`, DevTools e `webContents.debugger`.
- Manter todos os endpoints limitados ao acesso local e desligados quando os argumentos não forem passados.
- Expor ao client uma leitura validada do estado dos diagnósticos, sem permitir que a View ou ViewModel importe Electron.
- Definir mensagens de erro para porta inválida, porta ocupada e combinação de argumentos incompatível.
- Não implementar o servidor MCP neste ticket.

## Checklist

- [x] Parser de argumentos e política de ativação definidos
- [x] CDP, inspector do `main`, DevTools e debugger encapsulados
- [x] Estado local exposto por bridge tipada
- [x] Testes de app sem argumentos e com cada combinação válida
- [x] Build de produção sem endpoints quando nenhum argumento for passado
- [x] Notas da execução e suposições registradas

## Notas da execução

- O parser aceita `--diagnostics`, `--cdp-port=<porta>`, `--main-inspect-port=<porta>` e `--devtools`. Portas aceitas ficam entre 1024 e 65535; argumentos duplicados e `--devtools` sem `--diagnostics` são rejeitados.
- O CDP do Chromium é configurado antes de `app.whenReady()` e escuta somente em `127.0.0.1`. O inspector do `main` usa `node:inspector`, também em loopback, e é encerrado no fechamento do app.
- DevTools só abre por argumento explícito. O wrapper de `webContents.debugger` não anexa quando já existe uma conexão ativa, evitando disputar a sessão com DevTools.
- O bridge expõe o estado efetivo com portas e recursos ativos, sem expor Electron ao client.
- O pacote Linux de produção foi validado sem argumentos: não abriu portas de diagnóstico e manteve somente o `main.log` mínimo. Com `--diagnostics --cdp-port=19223 --main-inspect-port=19229`, as duas portas abriram em `127.0.0.1` e o endpoint `/json/version` do CDP respondeu HTTP 200.
- Desktop passou em 30 arquivos e 143 testes; bridge em 14 testes; web em 7 testes; client em 195 arquivos e 1.327 testes. Typecheck e lint dos pacotes alterados passaram.
- O MCP não recebeu argumento nem implementação neste ticket; continua reservado ao DIAG-04/DIAG-05.
- *(suposição)* A ocupação da porta do CDP é reportada pelo próprio Chromium durante a inicialização; a porta do inspector é convertida em erro explícito pelo módulo local.
- *(suposição)* `--devtools` exige `--diagnostics` para evitar abrir uma ferramenta detalhada sem o coletor correspondente.
