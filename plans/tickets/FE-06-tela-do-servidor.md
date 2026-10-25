# FE-06 · Tela do servidor

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: FE-03, FE-05 · Onda 4

## Contexto
A rota `/servers/$serverId` mostra a sidebar do servidor atual com salas e quem está nelas. A sala de voz não fica na URL.

## Escopo
- `modules/servers`: `use-server-screen` (servidor, papel, salas, presença), Screen da rota.
- Seletor de servidor com busca; aviso de "uma conexão por vez" ao trocar estando numa sala (lê a store de voz, que no início pode ser um stub até o FE-09).
- Owner e admin: item "Configurações do servidor" abre `?serverSettings=general`, com contador de pedidos. Member: "Sair do servidor" com confirmação.
- Card do usuário: abre `?settings=profile`. Logo volta ao Hub sem desconectar.
- Área vazia com o logo quando fora de sala.

## Fora do escopo
Modal do servidor (FE-07), voz (FE-09).

## Referências
- `plans/02-core-flows.md` F6
- `plans/tickets/BE-09-servidores-e-salas.md`, `BE-11-realtime-presenca.md`
- `modules/servers/views/server-screen.view.tsx`, `server-sidebar.view.tsx`, `members-presence.view.tsx`

## Checklist
- [x] ViewModel com `.spec.ts`
- [x] Screen ligada
- [x] Commit

## Critério de aceite
Abrir o servidor pelo Hub mostra salas e presença ao vivo; trocar de servidor e sair do servidor seguem o F6.

## Notas da execução (2026-10-25)

Feito por um agente Sonnet, em paralelo com FE-04, FE-06, FE-08 e FE-11, na branch `feature/web-routing`. Revisado pelo Opus, que rodou a suíte inteira com os quatro juntos (web 694 testes, api 271) e um teste headless (Playwright) das telas principais contra a API local.

- `use-server-screen` (servidor, papel, salas, presença pelo `use-server-subscription`, membros e contador de pedidos para owner e admin), `server.screen.tsx` e a rota com `loader`.
- Seletor de servidor com busca e aviso de "uma conexão por vez" lendo a store de voz (stub até o FE-09).
- Owner e admin: "Configurações do servidor" abre `?serverSettings=general`. Member: sair do servidor com confirmação.
- Card do usuário abre `?settings=profile`; logo volta ao Hub sem mexer na voz.
- 403 ou 404 no servidor: toast e volta ao Hub.
- No browser: servidor de teste criado e apagado pela API; sidebar com a sala, "Online (1)" pelo socket e área vazia com o logo.

Suposições *(confirmar)*:
- Clicar numa sala não faz nada até o FE-09; mute, deafen e "falando" ficam fixos. *(suposição)*
- Quem aparece na presença mas não está na lista de membros fica de fora da sidebar. *(suposição)*
- Nome do membro é `displayUsername ?? username`; ordem owner, admin, member e nome. *(suposição)*
- O contador de pedidos é o tamanho da lista de pedidos pendentes (a API não tem rota só de contagem). *(suposição)*
