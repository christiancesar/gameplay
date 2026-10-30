# Tickets: diagnóstico modular do desktop

Base: `../02-tech-plan.md`. Executar um ticket por vez na retomada, com status e notas da execução.

Divisão de trabalho: a branch `feature/desktop-diagnostics` implementará DIAG-01 a DIAG-04. O DIAG-05 será desenvolvido em uma branch separada, depois que o coletor e a interface local de diagnósticos estiverem estáveis.

| Ticket | Dependência | Status |
| --- | --- | --- |
| [DIAG-01 · Release sem logs](DIAG-01-release-sem-logs.md) | Nenhuma | concluído |
| [DIAG-02 · Eventos e coletor](DIAG-02-eventos-e-coletor.md) | DIAG-01 | concluído |
| [DIAG-03 · Inicialização e CDP local](DIAG-03-cdp-e-mcp.md) | DIAG-02 | concluído |
| [DIAG-04 · Painel Desenvolvimento e documentação](DIAG-04-painel-desenvolvimento.md) | DIAG-03, DIAG-05 | concluído |
| [DIAG-05 · MCP local somente leitura](DIAG-05-mcp-local.md) | DIAG-02, DIAG-03 | concluído |
