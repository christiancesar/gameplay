# DIAG-02 · Eventos e coletor

> Status: concluído. Depende de: DIAG-01.

## Escopo

- Definir porta tipada e eventos para captura, SFU/Mesh, áudio, rede e ciclo de vida da janela, com identificador de tentativa e limite de campos.
- Criar coletor de histórico local limitado, com amostragem para estatísticas frequentes e descarte previsível.
- Compor o módulo no `main` com dependências explícitas, seguindo os módulos existentes.
- Substituir `console.warn` e serialização em `screen-share-debug.ts` por eventos da porta. Remover o helper quando todos os usos migrarem.
- Ligar o renderer ao host por bridge validado, sem levar Electron às Views ou ViewModels.
- Cobrir ativação, desativação, correlação, descarte e ausência de trabalho quando o coletor estiver desligado.

## Checklist

- [x] Porta de eventos e esquemas definidos
- [x] Coletor e bridge implementados com limites
- [x] Diagnóstico de compartilhamento migrado
- [x] Testes de contexto, typecheck e lint verdes
- [x] Notas da execução e suposições registradas

## Notas da execução

- O contrato `DiagnosticEvent` usa uma união discriminada com limite por campo, `attemptId` e timestamp ISO. Foram incluídos eventos para captura, encoding, estatísticas Mesh/SFU, áudio, rede e ciclo de vida.
- O `DiagnosticsCollector` mantém no máximo 500 eventos em memória por padrão e descarta os mais antigos de forma previsível. Quando desligado, não armazena eventos nem serializa dados.
- O bridge ganhou os canais validados `diagnostics:is-enabled` e `diagnostics:record`. O renderer só registra eventos quando o host informa que o coletor está ativo.
- O helper `screen-share-debug.ts` foi removido. O `ShareSession` agora registra eventos estruturados com o mesmo `attemptId` desde a tentativa de captura até a parada, sem importar Electron.
- *(suposição)* O coletor permanece em memória nesta etapa; a consulta pelo painel e a exposição controlada para CDP/MCP ficam nos tickets seguintes.
- *(suposição)* A ativação atual segue o ambiente de desenvolvimento, para preservar a funcionalidade do diagnóstico durante esta etapa. A ativação por argumentos e pelo painel será feita no DIAG-03/DIAG-04.
