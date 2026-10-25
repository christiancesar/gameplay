# FE-07 · Modal do servidor (owner e admin)

> Pontos: 8 · Modelo sugerido: Sonnet · Depende de: FE-06 · Onda 5

## Contexto
O modal abre por `?serverSettings=<seção>` e tem seis seções. Cada seção pode virar um ViewModel próprio.

## Escopo
- Geral: nome, ícone, cover e descrição.
- Convites: auto aprovação, gerar (uso único, 1 hora), copiar, revogar, histórico; bloqueio no limite de membros.
- Pedidos: aprovar ou recusar, bloqueio no limite.
- Membros: promover, rebaixar, kick com confirmação.
- Salas: criar, renomear, excluir (com confirmação se houver gente), bloqueio no limite.
- Sair ou excluir: admin sai; owner exclui digitando o nome.
- Fechar o modal remove o search param.

## Fora do escopo
Limites globais e por servidor do admin da plataforma (FE-11).

## Referências
- `plans/02-core-flows.md` F7
- `plans/tickets/BE-09-servidores-e-salas.md`, `BE-10-convites-e-membros.md`
- `modules/servers/views/settings/*`

## Checklist
- [ ] Um ViewModel por seção com `.spec.ts`
- [ ] Seções ligadas ao modal
- [ ] Commit

## Critério de aceite
Todas as ações do F7 funcionam contra a API e as outras sessões abertas veem a mudança na hora (via FE-05).
