# PUB-08 · Roadmap, votos e feature requests

> Pontos: 8 · Depende de: PUB-05, PUB-07 · Branch `feature/public-roadmap-interactions`, saída da `dev`

## Escopo

- Conectar o roadmap público à API.
- Exibir contagem e estado do voto do usuário autenticado.
- Permitir votar e remover voto somente com sessão.
- Permitir abrir solicitação de feature somente com sessão.
- Exibir estados de login, carregamento, erro e solicitação enviada.
- Manter o roadmap navegável e revisável no Storybook.

## Fora do escopo

MCP, GitHub, comentários, notificações e votação anônima.

## Critério de aceite

Visitantes podem consultar o roadmap, usuários logados podem votar e abrir solicitações, e cada usuário pode ter no máximo um voto por item.

## Checklist

- [ ] ViewModel conectado à API
- [ ] Voto autenticado implementado
- [ ] Formulário de solicitação implementado
- [ ] Estados de sessão e erro cobertos
- [ ] Stories e testes atualizados
