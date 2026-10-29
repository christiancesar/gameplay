# 02 · Tech Plan: diagnóstico modular do desktop

> Base: `00-requirements.md` e `01-epic-brief.md`. Tickets em `tickets/`. Nenhuma implementação iniciada.

## Arquitetura proposta

Um `DiagnosticsModule` criado pelo `main` recebe a configuração do build e dependências explícitas. Ele entrega uma porta estreita para eventos, um histórico limitado em memória e adaptadores opcionais. As classes são úteis para serviços com ciclo de vida, estado e `dispose()`. Funções puras continuam como funções. O `main.ts` permanece como composition root.

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

## CDP, DevTools e MCP

- Encapsular `app.commandLine.appendSwitch` em configuração de inicialização do módulo: CDP externo precisa ser definido antes de `ready` e fica somente em builds permitidos. Preferir porta configurável para evitar colisão com outro Chromium local.
- Encapsular abertura de DevTools por janela. Não presumir que `webContents.debugger` e DevTools possam estar anexados simultaneamente; o Electron pode desconectar o debugger ao abrir DevTools.
- Avaliar `webContents.debugger` para coleta programática limitada de eventos do renderer. Não prometer leitura de estado de negócio apenas via CDP; os eventos de domínio continuam necessários.
- Implementar MCP como adaptador separado, desligado por padrão, com leitura de status, histórico filtrado e métricas recentes. Definir transporte local e mecanismo de ativação antes de abrir qualquer endpoint. Não oferecer avaliação arbitrária de JavaScript, acesso a cookies ou comandos que alterem o app.
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
- Transporte, ativação e clientes autorizados do servidor MCP local.
- Retenção máxima do histórico em memória e quais campos de captura/estatísticas são úteis sem expor dados de sessão.
