# BE-09 · Servidores e salas

> Pontos: 8 · Modelo sugerido: Sonnet · Depende de: BE-06, BE-07, BE-04 · Onda 6

## Contexto
Quem cria o servidor vira owner. Os papéis são `owner`, `admin` e `member` (tabela de permissões em 2.3). O owner é intocável e só sai excluindo o servidor. O servidor novo nasce com uma sala, que ocupa uma das duas vagas padrão. Owner e admin editam nome, descrição, ícone, cover e auto aprovação, e criam, editam e excluem salas. Só o owner exclui o servidor.

## Escopo
- Modelos `Server`, `ServerMember` e `Room` (ver `04-tech-plan.md` seção 2) e migration.
- Um único serviço de permissão por papel (`ServerPermissions`), que espelha a tabela de 2.3 e é reutilizado pelo BE-10 e pelo BE-11.
- Use-cases:
  - `CreateServer` (limite efetivo de servidores por usuário, owner e primeira sala na mesma transação);
  - `UpdateServer` e `SetAutoApprove`;
  - `UploadServerIcon`, `RemoveServerIcon`, `UploadServerCover` e `RemoveServerCover`;
  - `DeleteServer` (só o owner, cascata, publica `server.deleted` com os ids dos membros);
  - `ListMyServers` e `GetServer` (com o papel do usuário);
  - `CreateRoom` (limite efetivo de salas), `RenameRoom`, `DeleteRoom` e `ReorderRooms`, publicando `room.changed`.
- Rotas REST com DTOs do `packages/shared` e OpenAPI.
- Erros de domínio: limite atingido, sem permissão, servidor inexistente.

## Fora do escopo
Convites e membros (BE-10), presença nas salas (BE-11), exclusão de servidor pelo admin da plataforma (BE-15, que reutiliza o use-case).

## Referências
- `plans/00-requirements.md` 2.2, 2.3, 2.6 e 2.7
- `plans/02-core-flows.md` (Hub, criar servidor, modal do servidor)
- `plans/04-tech-plan.md` seções 2 e 3

## Checklist
- [ ] Modelos e migration
- [ ] `ServerPermissions` com testes que cobrem a tabela de 2.3 inteira
- [ ] Use-cases de servidor, com testes unitários (limite, permissão, transação do owner e da primeira sala)
- [ ] Use-cases de sala, com testes (limite, permissão)
- [ ] Rotas e e2e do fluxo: criar, editar, enviar ícone, criar sala até o limite, excluir
- [ ] Eventos de domínio publicados (teste com um listener falso)
- [ ] Commit a cada passo verde

## Critério de aceite
Os limites são respeitados, cada ação obedece à tabela de permissões, e excluir o servidor remove tudo em cascata e publica `server.deleted`.

## Herdado do BE-06
- Estender o `ResolveEffectiveLimit` com `membersPerServer` e `roomsPerServer` (override em `Server.maxMembersOverride` e `Server.maxRoomsOverride`).
- Criar `SetServerLimitOverride` e a rota de admin do override por servidor.

