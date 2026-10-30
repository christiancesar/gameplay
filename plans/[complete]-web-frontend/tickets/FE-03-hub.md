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
- `plans/[complete]-core-product/02-core-flows.md` F4, F5
- `plans/[complete]-backend/tickets/BE-09-servidores-e-salas.md`, `BE-13-notificacoes.md`, `BE-07-storage-e-imagens.md`
- Views em `modules/hub`, `modules/servers/views/create-server-*`, `modules/notifications`

## Checklist
- [x] ViewModels com `.spec.ts`
- [x] Screens ligadas
- [x] Upload de ícone com erro de tamanho e formato
- [x] Commit

## Critério de aceite
Usuário novo vê só criar e entrar; cria um servidor e cai na tela dele; no limite o card fica bloqueado; notificações somem ao dispensar.

## Notas da execução (2026-10-25)

Feito por um agente Sonnet, em paralelo com o FE-05, na branch `feature/web-routing`. Revisado pelo Opus.

- `modules/hub`: `use-hub` (perfil da sessão, servidores, limite, tema, navegação para servidor, admin e `?settings=profile`), `hub.screen.tsx` e rota `/` com `loader` que pré-carrega servidores e notificações sem bloquear a rota.
- `modules/servers`: `servers.service.ts`, `servers.query.ts`, regras `validate-icon-file` (2 MB, jpeg, png, webp) e `can-create-server`, mapper de erro e `use-create-server` (nome, ícone, `defaultRoomName` traduzido, abre `/servers/$serverId`).
- `modules/invites`: regra `parse-invite-code` (código ou link inteiro) e `use-join-by-code`, que navega para `/i/$code`.
- `modules/notifications`: listar, dispensar uma e todas (some na hora do cache e refaz a lista se falhar), botão de abrir servidor.
- Sair da conta pelo Hub usa o `useSignOutViewModel`; a confirmação é da View.
- Apoio de teste compartilhado em `shared/test/` e seed e contexto por módulo em `view-models/test/`.
- i18n: só a chave nova `hub.defaultRoomName` ("Room 1", "Sala 1").

Resultado: web 412 testes, api 271, typecheck, lint e format verdes. Formatos das respostas conferidos por curl; telas não testadas no browser.

Suposições *(confirmar)*:
- **Limite de servidores:** não existe rota para o usuário comum saber o limite efetivo, só as do admin. O card bloqueia quando o `maxServersOverride` do usuário é atingido, ou depois do primeiro 409 `SERVER_LIMIT_REACHED`. Um usuário novo no limite padrão vê o card liberado até tentar. Precisa de um ajuste na API (expor o limite efetivo em `/api/me` ou nas configurações públicas). *(suposição)*
- O ícone sobe depois de criar o servidor, porque a rota precisa do id. Se o upload falhar, o servidor existe e a pessoa entra nele sem aviso. *(suposição)*
- O campo de entrar por código só navega; os erros aparecem na página do convite (FE-04). *(suposição)*
- O aviso de permitir monitores no painel não faz nada; os avisos do ambiente são do FE-12. *(suposição)*
- Avatar do Hub vem de `session.user.image`, nome de `session.user.name`. *(suposição)*
