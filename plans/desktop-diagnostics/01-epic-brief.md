# 01 · Epic Brief: diagnóstico modular do desktop

> Base: `00-requirements.md`. Status: proposta para revisão futura.

## Problema

Durante a análise da transmissão ultrawide, foram introduzidos pontos de `console.warn` dentro do serviço de compartilhamento. Eles ajudaram a verificar captura e SFU, mas misturam a lógica da transmissão com o formato e o destino do diagnóstico. Ao mesmo tempo, o `main` já possui um logger, captura central de erros e telemetria. Hoje não existe uma única interface para consultar de forma estruturada o que ocorreu numa tentativa de compartilhamento.

Além disso, a condição de desenvolvimento protege CDP, DevTools e os avisos de `screen-share-debug.ts`, mas não desliga o arquivo `main.log` nem o encaminhamento dos logs do `main` em produção. O usuário decidiu que a próxima versão de produção não deve gerar logs.

## Resultado esperado

- Uma sessão de diagnóstico apresenta a sequência correlacionada de eventos: seleção da fonte, captura efetiva, publicação SFU/Mesh, resposta de `stream:start`, estatísticas observadas e encerramento.
- O processo `main` monta os serviços e adaptadores de diagnóstico por composição e injeção explícita. O client emite eventos de domínio por uma porta pequena, sem chamar `console.warn` ou conhecer CDP/MCP.
- CDP e MCP são adaptadores opcionais. Uma ferramenta conectada consegue consultar estado e histórico sem ter acesso irrestrito ao renderer.
- Um build de produção é verificavelmente silencioso quanto a logs. Uma falha nessa verificação impede gerar a release.

## Sequência de entrega

1. Fechar a lacuna dos logs na release de produção.
2. Criar a porta de eventos e o coletor com correlação, amostragem e limites de memória; migrar o diagnóstico de compartilhamento.
3. Modularizar a configuração do CDP/DevTools e adicionar uma interface local de consulta.
4. Avaliar e implementar MCP somente depois que a fonte de dados estiver estável.

## Critérios de sucesso

- Diagnóstico do caso 2560×1080 pode ser lido numa única sequência, sem vasculhar mensagens de console dispersas.
- Desativar um adaptador não altera o fluxo de captura, áudio ou chamada.
- Build de produção não abre `9223`, DevTools ou servidor MCP e não escreve `main.log`, console nem logs para Sentry.
- Testes cobrem as configurações de desenvolvimento e produção; nenhuma etapa exige banco local ou e2e de API.
