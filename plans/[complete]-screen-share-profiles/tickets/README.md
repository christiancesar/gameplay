# Tickets: perfis de qualidade para compartilhamento

Base: `../02-tech-plan.md`. A execução ocorre nesta branch de trabalho, conforme pedido do usuário. Nesta entrega, o usuário autorizou executar os três tickets em sequência. Ao terminar cada ticket: marcar checklist e registrar "Notas da execução" com suposições marcadas como _(suposição)_.

Validação comum por ticket, conforme a mudança:

- [x] Typecheck, lint e formato dos workspaces e arquivos alterados verdes
- [x] Testes unitários do client, desktop e desktop-bridge relevantes verdes
- [x] Stories das Views alteradas passando no projeto Storybook
- [x] Revisão manual da captura e estatísticas no desktop para os perfis afetados

Não executar banco, Docker nem e2e de API nesta máquina, conforme orientação do usuário. O app usa a instância de produção. A captura, a transmissão e as estatísticas dos perfis afetados foram validadas manualmente pelo usuário.

| Ticket                                                                               | Pontos | Onda | Status                                  |
| ------------------------------------------------------------------------------------ | -----: | ---: | --------------------------------------- |
| [SHARE-01 Layout e controles de perfil](SHARE-01-layout-e-controles.md)              |      3 |    1 | concluído                               |
| [SHARE-02 Perfil, contrato e codificação](SHARE-02-perfil-contrato-e-codificacao.md) |      8 |    2 | concluído |
| [SHARE-03 Recomendações e FPS avançado](SHARE-03-recomendacao-e-fps-avancado.md)     |      5 |    3 | concluído |
