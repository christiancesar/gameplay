# DIAG-03 · CDP e MCP opcionais

> Status: pendente. Depende de: DIAG-02.

## Escopo

- Isolar a configuração de CDP na inicialização e a abertura de DevTools por janela em serviços injetáveis.
- Avaliar instrumentação por `webContents.debugger` quando o DevTools estiver fechado, com ciclo de vida e desanexação tratados.
- Implementar adaptador MCP local, opcional e somente de leitura sobre o coletor, após definir transporte e ativação.
- Expor consultas estreitas de status, eventos e estatísticas recentes; não expor execução arbitrária de JavaScript nem dados de sessão.
- Verificar ativação e desligamento em desenvolvimento e ausência completa no build de produção.

## Checklist

- [ ] CDP e DevTools encapsulados e testados
- [ ] Compatibilidade de `webContents.debugger` com o fluxo de DevTools documentada
- [ ] MCP local de leitura implementado e testado
- [ ] Build de produção sem endpoints ou portas de diagnóstico
- [ ] Notas da execução e suposições registradas
