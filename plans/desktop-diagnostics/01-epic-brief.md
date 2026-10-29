# 01 · Epic Brief: diagnóstico modular do desktop

> Base: `00-requirements.md`. Status: detalhado para implementação futura. DIAG-01 a DIAG-04 pertencem à branch `feature/desktop-diagnostics`; DIAG-05 será desenvolvido separadamente.

## Problema

Durante a análise da transmissão ultrawide, foram introduzidos pontos de `console.warn` dentro do serviço de compartilhamento. Eles ajudaram a verificar captura e SFU, mas misturam a lógica da transmissão com o formato e o destino do diagnóstico. Ao mesmo tempo, o `main` já possui um logger, captura central de erros e telemetria. Hoje não existe uma única interface para consultar de forma estruturada o que ocorreu numa tentativa de compartilhamento.

Além disso, a condição de desenvolvimento protege CDP, DevTools e os avisos de `screen-share-debug.ts`, mas não desliga o arquivo `main.log` nem o encaminhamento dos logs do `main` em produção. O usuário decidiu que a próxima versão de produção não deve gerar logs.

## Resultado esperado

- Uma sessão de diagnóstico apresenta a sequência correlacionada de eventos: seleção da fonte, captura efetiva, publicação SFU/Mesh, resposta de `stream:start`, estatísticas observadas e encerramento.
- O processo `main` monta os serviços e adaptadores de diagnóstico por composição e injeção explícita. O client emite eventos de domínio por uma porta pequena, sem chamar `console.warn` ou conhecer CDP/MCP.
- CDP, inspector, coletor e MCP são módulos independentes. Uma ferramenta local consegue consultar estado e histórico sem ter acesso irrestrito ao renderer.
- O painel administrativo tem uma aba **Desenvolvimento** que informa o que foi ativado na inicialização e explica como iniciar o app com os argumentos necessários.
- O painel administrativo tem uma aba separada **MCP**, que é o único lugar que pode iniciar ou encerrar o servidor MCP local. O MCP aparece desligado até uma ação explícita de um administrador local.
- Um único documento MDX concentra a documentação da operação e é exibido no painel.
- Um build de produção é verificavelmente silencioso quanto a logs. Uma falha nessa verificação impede gerar a release.

## Sequência de entrega

1. Fechar a lacuna dos logs na release de produção.
2. Criar a porta de eventos e o coletor com correlação, amostragem e limites de memória; migrar o diagnóstico de compartilhamento.
3. Modularizar a configuração de inicialização, CDP, DevTools e inspector do `main`, todos desligados por padrão.
4. Criar a aba administrativa **Desenvolvimento** e a documentação MDX de operação.
5. Implementar MCP somente depois que a fonte de dados e a interface local estiverem estáveis. A ativação será feita pelo painel, não por argumento automático.

## Critérios de sucesso

- Diagnóstico do caso 2560×1080 pode ser lido numa única sequência, sem vasculhar mensagens de console dispersas.
- Desativar um adaptador não altera o fluxo de captura, áudio ou chamada.
- Build de produção não abre `9223`, DevTools ou servidor MCP e não escreve `main.log`, console nem logs para Sentry.
- App iniciado sem argumentos mostra todos os recursos de diagnóstico desligados no painel.
- App iniciado com argumentos mostra somente os recursos correspondentes como ativos, com portas locais corretas.
- MCP iniciado pelo painel aparece ativo somente durante a sessão autorizada e volta a ficar desligado após o encerramento do app.
- Testes cobrem as configurações de desenvolvimento e produção; nenhuma etapa exige banco local ou e2e de API.
