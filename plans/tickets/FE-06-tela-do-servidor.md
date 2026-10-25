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
- [ ] ViewModel com `.spec.ts`
- [ ] Screen ligada
- [ ] Commit

## Critério de aceite
Abrir o servidor pelo Hub mostra salas e presença ao vivo; trocar de servidor e sair do servidor seguem o F6.
