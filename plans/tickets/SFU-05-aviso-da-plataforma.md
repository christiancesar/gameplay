# SFU-05 · Aviso da plataforma

> Pontos: 3 · Modelo sugerido: Sonnet · Depende de: SFU-01 · Onda 2

## Contexto
Quando o admin desliga um recurso de mídia, as pessoas precisam entender o que aconteceu (decisão do usuário em 2026-10-27). O mesmo aviso serve para manutenção e deploy, então é um recurso próprio do admin, e a confirmação do SFU-04 usa ele.

## Escopo
- Tipo novo de notificação, aviso da plataforma, no módulo de notificações (BE-13): título curto e mensagem escrita pelo admin.
- Rota do admin da plataforma para enviar, com destinatários:
  - uma lista de usuários (usada pelo SFU-04 para "só os afetados");
  - os membros de um servidor;
  - todo mundo.
- Para todo mundo, cria uma notificação por usuário. Basta para o tamanho atual *(suposição)*.
- Chega pelo sino que já existe e, para quem está online, como toast na hora (`notification:new`).
- No admin, um jeito de enviar um aviso solto (sem desligar nada), com os mesmos destinatários *(suposição: um botão na aba Mídia ou em Usuários, decidir na execução)*.
- i18n em `en` e `pt` para os textos fixos; a mensagem é a que o admin escreveu, sem tradução.
- Stories e testes.

## Fora do escopo
Confirmação ao desligar recursos (SFU-04). Banner fixo no topo do app. Agendar aviso. E-mail.

## Referências
- `plans/tickets/BE-13-notificacoes.md`, `FE-03-hub.md`, `FE-11-admin.md`

## Checklist
- [x] Tipo de notificação e rota de envio, com e2e
- [x] Os três tipos de destinatário
- [x] Toast para quem está online e item no sino
- [x] Envio solto no admin, com story
- [x] i18n e testes
- [x] Commit

## Critério de aceite
O admin envia um aviso para os membros de um servidor; quem está online vê o toast na hora e quem estava offline encontra o aviso no sino ao entrar.

## Notas da execução
- **Contrato:** `NOTIFICATION_TYPES` ganhou `platform-announcement`, e a notificação virou uma união: as de servidor continuam com `server`, o aviso vem com `announcement: { title, message }`. O texto do aviso é o que o admin escreveu, sem i18n. `SERVER_NOTIFICATION_TYPES` separa os tipos de servidor. O `notification:new` passou a levar `announcement` quando é um aviso.
- **API:** `POST /api/admin/announcements` (só admin da plataforma, com 2FA, como as outras rotas do admin) com `title` (até 80), `message` (até 500) e `audience`: `everyone`, `server` (`serverId`) ou `users` (`userIds`, até 500). Responde `201 { recipients }`. Servidor inexistente dá 404. Ids de usuário que não existem são ignorados, e repetidos contam uma vez.
- **Banco:** valor `PLATFORM_ANNOUNCEMENT` no enum `NotificationType` (migration `platform_announcement`). O `payload` guarda `{ title, message }`.
- **Quem recebe "todo mundo":** todas as contas, inclusive suspensas. *(Suposição: a suspensa só vê o aviso se for reativada.)* Uma notificação por pessoa, gravadas de uma vez.
- **Toast:** quem está online recebe o `notification:new` com o texto e vê um toast com título e mensagem, em qualquer tela. O aviso também fica no sino do Hub até ser dispensado, com ícone de megafone e as quebras de linha da mensagem.
- **Admin:** aba nova **Avisos** (`/admin/announcements`), com título, mensagem (com contador de caracteres), destinatário (todo mundo ou membros de um servidor) e escolha do servidor. Depois de enviar, aparece "Aviso enviado para N pessoas" e o formulário volta vazio. *(Suposição: o seletor lista os primeiros 100 servidores, o que basta para o tamanho atual. Enviar para usuários escolhidos à mão ficou só na API, para o SFU-04 usar com "só os afetados".)* *(Suposição: não pede confirmação antes de enviar para todo mundo.)*
- **Stories:** `Hub/PlatformAnnouncement` (aviso no painel, dispensar) e `Admin/AdminPanel` com `Announcements` e `SendAnnouncement` (validação de campos vazios, servidor obrigatório e envio).
- **Testes:** unitários do envio (todo mundo, servidor, usuários), do listener do realtime, do mapper e dos ViewModels; e2e da API (aviso para membros de um servidor chega pelo socket com o texto e fica no Hub; todo mundo; só admin envia; título vazio dá 400). O e2e rodou com um Postgres temporário; o do S3 não rodou (precisa do s3mock). Suítes do web: 870 unitários e 255 de Storybook passando. Não abri o app no browser para conferir visualmente; o Cypress não foi rodado.
