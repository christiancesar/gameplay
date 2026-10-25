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
- [x] Um ViewModel por seção com `.spec.ts`
- [x] Seções ligadas ao modal
- [x] Commit

## Critério de aceite
Todas as ações do F7 funcionam contra a API e as outras sessões abertas veem a mudança na hora (via FE-05).

## Notas da execução (2026-10-25)

Feito por um agente Sonnet, em paralelo com os outros dois tickets da onda (FE-07, FE-09, FE-12), na branch `feature/web-routing`. Revisado pelo Opus, que rodou tudo junto: web 975 testes, api 282, Cypress 26 de 26.

- `ServerSettingsScreen` lê `serverId` e `?serverSettings=` da rota; trocar de seção substitui o param e fechar remove. Só a seção aberta monta o seu ViewModel. Montado em `server.screen.tsx` pelo Opus.
- Seções com ViewModel e spec cada: geral (nome, ícone, cover, descrição), convites (auto aprovação, gerar, copiar link, revogar, histórico), pedidos, membros (promover, rebaixar, kick), salas (criar, renomear, reordenar, excluir com confirmação se houver gente, lida da store de presença), sair ou excluir.
- Member que abre a URL, ou admin rebaixado com o modal aberto, tem o modal fechado.
- Depois de cada ação invalida o detalhe (e a lista quando muda nome, ícone ou cover). Sair ou excluir vai para `/` e atualiza a lista e o limite.
- Mapper dos códigos reais da API (`MEMBER_LIMIT_REACHED`, `ROOM_LIMIT_REACHED`, `ROOM_NAME_TAKEN` e outros) com spec.
- No browser: `?serverSettings=invites` abre a seção de convites.

Suposições *(confirmar)*:
- O cover usa a mesma regra do ícone (2 MB, JPEG, PNG ou WebP). *(suposição)*
- Convite ativo com `expiresAt` no passado aparece como expirado no cliente. *(suposição)*
- Nome de quem criou ou usou o convite é o `username` (o contrato não traz `displayUsername` ali). *(suposição)*
- Limite atingido entre carregar e agir, nome de sala repetido e outros erros sem campo na View aparecem em toast. *(suposição)*
