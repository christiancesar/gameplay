# FE-03 · Hub, criar servidor e notificações

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: FE-02 · Onda 3

## Contexto
O Hub é onde o usuário cai depois do login. Mostra perfil, servidores, criar servidor, entrar por código e o painel de notificações.

## Escopo
- `modules/hub`: `use-hub` (perfil da sessão, servidores do usuário, limite de servidores), Screen da rota `/`.
- `modules/servers`: `use-create-server` (nome, ícone por upload, `defaultRoomName` traduzido), abre `/servers/$serverId` no sucesso. Card desabilitado no limite.
- Campo "entrar em um servidor": aceita o código ou o link inteiro e navega para `/i/$code`.
- `modules/notifications`: listar, dispensar uma e todas; botão "abrir servidor" das notificações de aprovação.
- Ícones de admin (só admin da plataforma), configurações (`?settings=profile`), tema e idioma.
- Query keys em `model/services/*.keys.ts` para o FE-05 invalidar.

## Fora do escopo
Avisos de browser, VPN e aceleração gráfica (FE-12), notificação em tempo real (FE-05).

## Referências
- `plans/02-core-flows.md` F4, F5
- `plans/tickets/BE-09-servidores-e-salas.md`, `BE-13-notificacoes.md`, `BE-07-storage-e-imagens.md`
- Views em `modules/hub`, `modules/servers/views/create-server-*`, `modules/notifications`

## Checklist
- [ ] ViewModels com `.spec.ts`
- [ ] Screens ligadas
- [ ] Upload de ícone com erro de tamanho e formato
- [ ] Commit

## Critério de aceite
Usuário novo vê só criar e entrar; cria um servidor e cai na tela dele; no limite o card fica bloqueado; notificações somem ao dispensar.
