# BE-13 · Notificações do Hub

> Pontos: 3 · Modelo sugerido: Haiku ou Sonnet · Depende de: BE-10, BE-11 · Onda 8

## Contexto
O Hub mostra avisos guardados por usuário até serem dispensados: pedido enviado, pedido aprovado, removido de um servidor, servidor excluído, promovido, rebaixado e convite expirado no cadastro. Os alertas de browser, aceleração gráfica e monitores são calculados no web e não passam por aqui *(suposição)*.

## Escopo
- Modelo `Notification` e migration.
- Listeners dos eventos de domínio que gravam a notificação de cada destinatário e emitem `notification:new` pelo gateway.
- Use-cases e rotas: `ListMyNotifications`, `DismissNotification` e `DismissAll`.
- Payload com ids e nomes, sem texto pronto: o web monta a mensagem com i18n.

## Fora do escopo
Toasts dentro do servidor (o web reage aos eventos do socket diretamente).

## Referências
- `plans/[complete]-core-product/00-requirements.md` 2.12.1
- `plans/[complete]-core-product/02-core-flows.md` (Hub, notificações)
- `plans/[complete]-backend/04-tech-plan.md` seções 2 e 3

## Checklist
- [x] Modelo e migration
- [x] Listeners, com testes por tipo de evento
- [x] Rotas, com e2e (kick gera a notificação para o expulso; dispensar some da lista)
- [x] `notification:new` emitido (e2e com o socket)
- [x] Commit

## Critério de aceite
Cada evento listado em 2.12.1 vira uma notificação persistida para a pessoa certa, que chega em tempo real e pode ser dispensada.

## Notas da execução
- Módulo `src/modules/notifications`. Modelo `Notification` em `prisma/schema/notification.prisma` (tipo em enum, `payload` JSON com `serverId` e `serverName`, `dismissedAt`), migration `notifications`.
- **Quem recebe o quê** fica numa tabela pura, `domain/notices-for.ts` (`noticesFor`), testada evento por evento. O `NotificationsListener` só chama essa tabela e o `NotifyUseCase`, que grava uma notificação por destinatário e publica `notification.created` para cada uma.
- **Tempo real sem acoplamento:** o módulo não importa o gateway. O listener do `realtime` ouve `notification.created` e emite `notification:new` (`{ id }`) para todas as abas da pessoa.
- **Tipos** (no contrato em minúsculas): `join-request-sent`, `join-approved`, `kicked`, `server-deleted`, `promoted`, `demoted`, `invite-expired`. O payload da API é `{ id, type, server: { id, name }, createdAt }`, com o nome do servidor da hora do evento.
- `server.deleted` passou a levar `serverName` e `deletedById` (nulo quando o admin da plataforma excluir, no BE-15). `DeleteServerUseCase.deleteById(serverId, deletedById)`.
- **Rotas:** `GET /api/me/notifications` (não dispensadas, mais nova primeiro), `POST /api/me/notifications/:id/dismiss` e `POST /api/me/notifications/dismiss-all` (204). Dispensar de novo não dá erro; id de outra pessoa ou inexistente dá 404 `NOTIFICATION_NOT_FOUND`. Dispensar marca `dismissedAt`, não apaga.
- **Testes:** seed em `test/notifications-seed.ts` e montagem em `test/notifications-context.ts`, no formato pedido no BE-12.
- **Suposições minhas a confirmar:**
  - Entrada por auto aprovação não gera `join-approved` (a pessoa acabou de entrar sozinha). Só gera quando alguém aprovou.
  - Sair do servidor por conta própria não gera aviso; só o kick.
  - Pedido recusado não gera aviso, porque não está na lista do 2.12.1. Fácil de acrescentar se você quiser.
  - Excluir o servidor avisa todos os membros menos quem excluiu.
  - Servidor que sumiu antes de a notificação ser gravada (corrida) não gera aviso, salvo quando o evento já traz o nome.
