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
- `plans/00-requirements.md` 2.12.1
- `plans/02-core-flows.md` (Hub, notificações)
- `plans/04-tech-plan.md` seções 2 e 3

## Checklist
- [ ] Modelo e migration
- [ ] Listeners, com testes por tipo de evento
- [ ] Rotas, com e2e (kick gera a notificação para o expulso; dispensar some da lista)
- [ ] `notification:new` emitido (e2e com o socket)
- [ ] Commit

## Critério de aceite
Cada evento listado em 2.12.1 vira uma notificação persistida para a pessoa certa, que chega em tempo real e pode ser dispensada.
