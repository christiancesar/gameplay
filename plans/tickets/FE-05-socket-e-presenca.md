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
- [x] Testes da ponte de eventos com socket falso
- [x] Banner de reconexão
- [x] Commit

## Critério de aceite
Derrubar a API mostra "Reconectando" e some ao voltar; kick, exclusão de servidor e suspensão levam o usuário ao lugar certo com a mensagem do F13.

## Notas da execução (2026-10-25)

Feito por um agente Sonnet, em paralelo com o FE-03, na branch `feature/web-routing`. Revisado pelo Opus.

- Socket num singleton de módulo (`modules/realtime/model/services/realtime.service.ts`) atrás de uma interface pequena, criado só no primeiro uso. Não é estado reativo, por isso não foi para um context do React.
- `AuthedLayoutScreen` chama `use-realtime-connection`: conecta ao montar o layout logado e desconecta ao desmontar. O sign-out também desconecta.
- Store de conexão e `ConnectionBannerScreen` no layout raiz. "Reconectado" aparece por 2,5 s.
- Ponte de eventos (`use-realtime-events`): `server:changed` invalida o servidor e a lista; `server:removed` mostra o aviso do F13 e volta ao Hub se a pessoa estava nele; `session:revoked` desconecta, limpa o QueryClient e vai para o SignIn; `notification:new` invalida as notificações.
- `use-server-subscription` (com ack e nova inscrição a cada reconexão) e store de presença, prontos para o FE-06. Ainda não ligados a nenhuma tela.
- i18n: reaproveita `notices.*` e `connection.*`; chave nova `realtime.unknownServer`.

Resultado: specs da ponte com socket falso, da store, da inscrição e do sign-out; suíte toda verde. Handshake conferido com um script Node usando o cookie do admin do seed. Banner e fluxo no browser ainda não testados.

Suposições *(confirmar)*:
- `session:revoked` não traz motivo, então o aviso é sempre "sessão encerrada", nunca "conta suspensa". *(suposição)*
- Nome do servidor no aviso de kick ou exclusão vem do cache; sem cache aparece "este servidor". *(suposição)*
- Quando o Socket.IO não vai tentar de novo sozinho (handshake negado, fechado pelo servidor), o estado é `disconnected` e o banner fica escondido. Só quedas recuperáveis mostram "Reconectando". *(suposição)*
- Depois de `server:removed`, a query do servidor é removida do cache em vez de invalidada, para não refazer e tomar 403. *(suposição)*
- `room:participants` também alimenta a store de presença, para o FE-09 reaproveitar. *(suposição)*
- O contrato não tem evento de sair da inscrição; trocar de servidor só limpa a store. *(suposição)*
