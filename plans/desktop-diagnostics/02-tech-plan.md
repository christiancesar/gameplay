# 02 · Tech Plan: diagnóstico modular do desktop

> Base: `00-requirements.md` e `01-epic-brief.md`. Tickets em `tickets/`. Nenhuma implementação iniciada.

## Arquitetura proposta

Um `DiagnosticsModule` criado pelo `main` recebe a configuração de inicialização e dependências explícitas. Ele entrega uma porta estreita para eventos, um histórico limitado em memória e adaptadores opcionais. As classes são úteis para serviços com ciclo de vida, estado e `dispose()`. Funções puras continuam como funções. O `main.ts` permanece como composition root.

Fluxo: serviço de domínio → porta de eventos → coletor estruturado → histórico limitado → adaptadores de consulta. O serviço não decide se o evento vai para console, arquivo, CDP ou MCP.

Exemplo conceitual, ainda não é contrato final:

```ts
type DiagnosticEvent = {
  name: "share.capture.started" | "share.sfu.published" | "share.start.rejected";
  attemptId: string;
  at: string;
  data: Record<string, string | number | boolean | null>;
};

interface DiagnosticSink {
  enabled(category: string): boolean;
  record(event: DiagnosticEvent): void;
}
```

Para o client compartilhado, a porta deve ser injetada pela `Platform`, com implementação vazia para o navegador ou outra implementação quando ele precisar de diagnóstico local. No desktop, o bridge envia apenas eventos validados ao `main`. Verificar se a porta de telemetria existente pode ser reutilizada sem misturar logs de produção com diagnóstico local. O contrato final deve evitar `Record<string, unknown>` indiscriminado e incluir esquema/limite por tipo de evento.

## Configuração de inicialização

O `main` lê os argumentos de `process.argv` antes de `app.whenReady()`. A configuração é validada uma vez e passada aos módulos. O app normal não ativa nenhum recurso.

Contrato inicial proposto:

| Argumento | Efeito |
| --- | --- |
| `--diagnostics` | ativa o coletor local de eventos e histórico limitado |
| `--cdp-port=<porta>` | ativa o endpoint CDP local do Chromium |
| `--main-inspect-port=<porta>` | ativa o inspector local do processo `main` |
| `--devtools` | permite abrir DevTools por janela quando solicitado |

Os argumentos devem rejeitar portas inválidas, colisões detectáveis e combinações inconsistentes. O status exposto ao painel deve refletir a configuração efetivamente aplicada, não apenas a presença textual de um argumento.

## CDP, DevTools e inspector

- Encapsular `app.commandLine.appendSwitch('remote-debugging-port', ...)` em configuração de inicialização do módulo: CDP externo precisa ser definido antes de `ready`. A porta só deve ser configurada quando `--cdp-port` estiver presente e deve ficar limitada ao acesso local.
- O inspector do processo `main` é separado do CDP do renderer e usa `--main-inspect-port`. Não prometer que uma única porta inspeciona os dois processos.
- Encapsular abertura de DevTools por janela. Não presumir que `webContents.debugger` e DevTools possam estar anexados simultaneamente; o Electron pode desconectar o debugger ao abrir DevTools.
- Avaliar `webContents.debugger` para coleta programática limitada de eventos do renderer. Não prometer leitura de estado de negócio apenas via CDP; os eventos de domínio continuam necessários.

## Painel administrativo e documentação

- Criar a aba **Desenvolvimento** dentro do painel administrativo existente.
- Mostrar na aba Desenvolvimento cartões independentes para diagnóstico, CDP, inspector do `main` e DevTools.
- Criar uma aba administrativa separada **MCP** para o servidor MCP local.
- Sem argumentos, todos aparecem como desligados, com instruções de inicialização.
- Com argumentos, mostrar estado, porta local e limitações da sessão.
- O texto operacional fica em um único arquivo MDX do módulo admin. A View recebe o conteúdo já preparado pelo ViewModel e não acessa Electron, router ou processo local diretamente.
- O painel não abre portas nem ativa o CDP remotamente. Ele documenta e mostra o estado da instância em que está rodando.
- A aba MCP pode iniciar e encerrar somente o MCP local, por ser um serviço criado em tempo de execução. A configuração deve sair da aplicação ao encerrá-la.
- O MCP não recebe configuração nem comandos pelo servidor self-hosted. O painel local é o único controle autorizado.

## MCP local

- Implementar MCP como adaptador separado, desligado por padrão, com leitura de status, histórico filtrado e métricas recentes.
- O painel inicia o servidor sob demanda e mostra o estado, endereço local, porta, token temporário e instruções para a ferramenta externa.
- Preferir transporte HTTP somente em loopback, com porta dinâmica e token temporário, para que o painel consiga iniciar e encerrar o servidor. Avaliar Unix socket como alternativa caso os clientes alvo suportem o transporte necessário.
- O processo de ativação deve criar uma sessão temporária, revogável e vinculada ao usuário administrador local que a iniciou.
- Não oferecer avaliação arbitrária de JavaScript, acesso a cookies ou comandos que alterem o app.
- Versionar o contrato de eventos, para que o MCP não dependa de mensagens formatadas para humanos.

## Política de produção e custo

Antes do próximo build de produção, executar o ticket DIAG-01. Hoje `logging.module.ts` sempre abre arquivo e `main.ts` encaminha linhas `info+` ao Sentry quando configurado. A proteção de `screen-share-debug.ts` é runtime, então ainda há importações e chamadas no código empacotado, mesmo quando elas não emitem mensagens. A implementação futura deve evitar coleta, serialização e I/O quando diagnóstico estiver desativado; avaliar o código gerado para confirmar se o bundler elimina os trechos exclusivos de desenvolvimento.

Separar a decisão sobre erros e métricas de Sentry da decisão sobre logs. Até essa política ser confirmada, o aceite de DIAG-01 exige que a categoria **logs** esteja completamente desligada em produção, sem desligar automaticamente `captureError` e `measure` _(suposição)_. Registrar volume e frequência máximos em desenvolvimento, especialmente nas estatísticas WebRTC.

## Validação

- Testes unitários de política de ativação, correlação e limite/amostragem do coletor.
- Testes do `main` sem Electron real para composição, ciclo de vida e ausência de adaptadores em produção.
- Inspeção do pacote de produção: sem porta CDP, DevTools, MCP, arquivo `main.log`, mensagens de console nem encaminhamento de logs.
- Teste manual do pacote de desenvolvimento: rastrear uma tentativa de transmissão e consultar a mesma sequência pela interface local.
- Sem banco, Docker ou e2e de API nesta máquina, conforme instrução atual do usuário.

## Decisões pendentes para a retomada

- Se a regra “sem logs em produção” também desliga captura de exceções e métricas no Sentry, além do envio de logs.
- Transporte HTTP local ou Unix socket, ativação pelo painel e clientes autorizados do servidor MCP local.
- Retenção máxima do histórico em memória e quais campos de captura/estatísticas são úteis sem expor dados de sessão.
- Quais clientes externos serão suportados primeiro pelo MCP local _(suposição: Codex, Claude e Cursor, sem exigir suporte a todos no primeiro ticket)_.
