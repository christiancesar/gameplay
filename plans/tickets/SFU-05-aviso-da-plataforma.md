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
- [ ] Tipo de notificação e rota de envio, com e2e
- [ ] Os três tipos de destinatário
- [ ] Toast para quem está online e item no sino
- [ ] Envio solto no admin, com story
- [ ] i18n e testes
- [ ] Commit

## Critério de aceite
O admin envia um aviso para os membros de um servidor; quem está online vê o toast na hora e quem estava offline encontra o aviso no sino ao entrar.
