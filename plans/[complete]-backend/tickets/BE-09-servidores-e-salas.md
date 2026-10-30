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
- Rotas REST com DTOs do `packages/contracts` e OpenAPI.
- Erros de domínio: limite atingido, sem permissão, servidor inexistente.

## Fora do escopo
Convites e membros (BE-10), presença nas salas (BE-11), exclusão de servidor pelo admin da plataforma (BE-15, que reutiliza o use-case).

## Referências
- `plans/[complete]-core-product/00-requirements.md` 2.2, 2.3, 2.6 e 2.7
- `plans/[complete]-core-product/02-core-flows.md` (Hub, criar servidor, modal do servidor)
- `plans/[complete]-backend/04-tech-plan.md` seções 2 e 3

## Checklist
- [x] Modelos e migration
- [x] `ServerPermissions` com testes que cobrem a tabela de 2.3 inteira
- [x] Use-cases de servidor, com testes unitários (limite, permissão, transação do owner e da primeira sala)
- [x] Use-cases de sala, com testes (limite, permissão)
- [x] Rotas e e2e do fluxo: criar, editar, enviar ícone, criar sala até o limite, excluir
- [x] Eventos de domínio publicados (teste com um listener falso)
- [x] Commit a cada passo verde

## Critério de aceite
Os limites são respeitados, cada ação obedece à tabela de permissões, e excluir o servidor remove tudo em cascata e publica `server.deleted`.

## Herdado do BE-06 (feito)
- Estender o `ResolveEffectiveLimit` com `membersPerServer` e `roomsPerServer` (override em `Server.maxMembersOverride` e `Server.maxRoomsOverride`).
- Criar `SetServerLimitOverride` e a rota de admin do override por servidor.


## Notas da execução
- Módulo `src/modules/servers`. Modelos em `prisma/schema/server.prisma`: `Server`, `ServerMember` (enum `ServerRole`: `OWNER`, `ADMIN`, `MEMBER`) e `Room`. Membros e salas são apagados em cascata com o servidor; `ServerMember` também com o usuário. Na API e no `packages/contracts` os papéis são minúsculos (`owner`, `admin`, `member`).
- **Permissões:** `ServerPermissions` (`domain/server-permissions.ts`) é a tabela de 2.3 em código, com `can(papel, ação)` e `canActOn(ator, alvo, 'kick' | 'promote' | 'demote')`, que nunca deixa agir sobre o owner. O teste percorre a tabela inteira. `ServerAccessService` (exportado, em `services/server-access.service.ts`) carrega o servidor com o papel do usuário e aplica a tabela; quem não é membro recebe 404 `SERVER_NOT_FOUND`, igual a um servidor inexistente, para não vazar ids. Sem permissão: 403 `SERVER_PERMISSION_DENIED`.
- **Rotas:**
  - `POST /api/servers` (`name`, `description` opcional, `defaultRoomName` opcional), `GET /api/servers` (lista do Hub com papel e ícone), `GET /api/servers/:serverId` (detalhe com papel, contagem de membros, limites efetivos e salas), `PATCH /api/servers/:serverId` (nome e descrição), `PUT /api/servers/:serverId/auto-approve`, `DELETE /api/servers/:serverId` (só owner).
  - `PUT` e `DELETE /api/servers/:serverId/icon` e `/cover`.
  - `POST /api/servers/:serverId/rooms`, `PATCH` e `DELETE /api/servers/:serverId/rooms/:roomId`, `PUT /api/servers/:serverId/rooms/order` (todas as salas, uma vez cada).
  - `PUT /api/admin/servers/:serverId/limits` (`maxMembers`, `maxRooms`, `null` volta ao padrão), herdada do BE-06.
- **Limites e concorrência:** criar servidor trava a linha do usuário (`SELECT ... FOR UPDATE`) antes de contar, então dois pedidos ao mesmo tempo não passam do limite (e2e cobre). Criar, renomear e reordenar salas trava a linha do servidor do mesmo jeito. O repositório recebe um `guard` que roda dentro da transação; a regra continua no use-case. Baixar um override abaixo do que já existe só bloqueia novos, ninguém é removido.
- **Nome da primeira sala:** o web manda `defaultRoomName` no idioma de quem cria ("Sala 1" ou "Room 1"); sem ele, a API usa "Room 1". *(Suposição minha, confirmar.)*
- Nome de servidor e de sala com 1 a 40 caracteres, descrição até 280, os mesmos limites dos schemas do web. Descrição vazia vira `null`. Nome de sala único no servidor sem diferenciar maiúsculas (409 `ROOM_NAME_TAKEN`).
- **Ícone e cover:** um use-case de upload e um de remoção, com o tipo (`icon` ou `cover`) como parâmetro, em vez dos quatro do escopo. Chave `icons/<serverId>/<hash>.webp` (256x256) ou `covers/<serverId>/<hash>.webp` (1280x720). O arquivo antigo é apagado depois de gravar o novo; falha ao apagar vira aviso no log. Excluir o servidor apaga os dois arquivos.
- `SetAutoApprove` usa o mesmo `UpdateServerUseCase`, com rota própria.
- **Eventos de domínio** (em `common/events/domain-events.ts`): `server.updated` (`{ serverId }`, nome, descrição, imagens ou auto aprovação; não estava no plano, adicionei para o gateway emitir `server:changed`), `server.deleted` (`{ serverId, memberIds }`, publicado depois de apagar) e `room.changed` (`{ serverId, deletedRoomId? }`; o id da sala excluída serve para o BE-11 tirar quem estava nela).
- `DeleteServerUseCase.deleteById()` apaga sem checar papel, para o BE-15 reutilizar. A confirmação digitando o nome do servidor fica só no web.
- **Bug corrigido no BE-06:** com a linha de `PlatformSettings` ausente (banco esvaziado nos e2e), duas leituras ao mesmo tempo faziam `upsert` e uma falhava na chave primária (500). Agora a linha é recriada com `INSERT ... ON CONFLICT DO NOTHING`.
- **Ajuste depois do review (2026-10-24):** os services ganharam o sufixo `.service.ts` e o nome `XxxService` (`ServerAccessService`, `ServerViewsService`). Os perfis de ícone e cover foram para `domain/server-images.ts`, e o helper que apaga a imagem antiga para `use-cases/delete-previous-image.ts`. O resolvedor de limites virou `EffectiveLimitsService`, para um service não depender de um use-case. As camadas `services/`, `providers/` e `domain/` estão descritas no `04-tech-plan.md`, seção 1.
