# FE-05 · Socket, presença e eventos de remoção

> Pontos: 5 · Modelo sugerido: Opus · Depende de: FE-01 · Onda 2

## Contexto
O socket conecta no layout `_authed` e avisa o que o servidor muda sem ser perguntado. Os eventos só invalidam queries ou atualizam stores.

## Escopo
- `shared/lib/socket.ts` ligado no `_authed`: conectar com o cookie, desconectar no sign-out.
- Store de conexão (conectado, reconectando) e `ConnectionBanner` no `__root`.
- `server:subscribe` ao abrir um servidor; presença dos membros numa store.
- Ponte de eventos: `server:changed` invalida as queries do servidor; `server:removed` (kick ou exclusão) volta ao Hub com aviso; `session:revoked` (suspensão ou sessões encerradas) limpa tudo e vai para o SignIn com mensagem; `notification:new` invalida as notificações.
- Toasts do F13.

## Fora do escopo
Salas de voz e sinalização (FE-09).

## Referências
- `plans/02-core-flows.md` F13
- `plans/tickets/BE-11-realtime-presenca.md`, `BE-13-notificacoes.md`
- `packages/contracts/src/realtime/events.ts`, `ack.ts`
- `modules/connection/views`

## Checklist
- [ ] Testes da ponte de eventos com socket falso
- [ ] Banner de reconexão
- [ ] Commit

## Critério de aceite
Derrubar a API mostra "Reconectando" e some ao voltar; kick, exclusão de servidor e suspensão levam o usuário ao lugar certo com a mensagem do F13.
