# DIAG-02 · Eventos e coletor

> Status: pendente. Depende de: DIAG-01.

## Escopo

- Definir porta tipada e eventos para captura, SFU/Mesh, áudio, rede e ciclo de vida da janela, com identificador de tentativa e limite de campos.
- Criar coletor de histórico local limitado, com amostragem para estatísticas frequentes e descarte previsível.
- Compor o módulo no `main` com dependências explícitas, seguindo os módulos existentes.
- Substituir `console.warn` e serialização em `screen-share-debug.ts` por eventos da porta. Remover o helper quando todos os usos migrarem.
- Ligar o renderer ao host por bridge validado, sem levar Electron às Views ou ViewModels.
- Cobrir ativação, desativação, correlação, descarte e ausência de trabalho quando o coletor estiver desligado.

## Checklist

- [ ] Porta de eventos e esquemas definidos
- [ ] Coletor e bridge implementados com limites
- [ ] Diagnóstico de compartilhamento migrado
- [ ] Testes de contexto, typecheck e lint verdes
- [ ] Notas da execução e suposições registradas
