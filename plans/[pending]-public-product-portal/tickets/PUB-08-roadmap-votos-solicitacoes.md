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

- [x] ViewModel conectado à API
- [x] Voto autenticado implementado
- [x] Formulário de solicitação implementado
- [x] Estados de sessão e erro cobertos
- [x] Stories e testes atualizados

## Notas da execução

- O roadmap público deixou de usar seeds estáticos e passou a consumir `GET /public/roadmap` pela camada de serviço do módulo.
- Usuários autenticados podem votar e remover o voto em cada item. O cache local é atualizado com a resposta da API.
- Visitantes podem consultar o roadmap, mas são encaminhados para login ao tentar votar ou enviar uma solicitação.
- Usuários autenticados podem enviar solicitações de feature para `POST /public/feature-requests`, com validação pelo contrato compartilhado.
- A View cobre carregamento, erro de leitura, estado vazio, estado autenticado e confirmação de solicitação enviada.
- Foram adicionados stories para listagem, vazio, loading, erro, português e sessão autenticada, além de testes do ViewModel para consulta e voto.
- _(suposição)_ A solicitação enviada permanece confirmada na tela durante a sessão atual, sem uma tela própria para listar solicitações do usuário.
- _(suposição)_ O login é iniciado pelo callback da navegação pública e retorna ao fluxo padrão de autenticação, sem adicionar redirect específico neste ticket.

Validações executadas: `npm run repo:typecheck`, `npm run repo:lint`, `npm run repo:format-check`, `npm run client:test` e `npm run web:build`.
