# PUB-09 · Changelog gerenciável

> Pontos: 5 · Depende de: PUB-05, PUB-07 · Branch `feature/public-changelog-api`, saída da `dev`

## Escopo

- Conectar a listagem e o detalhe do changelog à API.
- Permitir ao admin criar, editar, publicar e arquivar entradas.
- Preservar busca, detalhe por slug, idioma da interface e fallback de Storybook.
- Cobrir estados vazio, carregamento, erro e item não encontrado.

## Fora do escopo

Editor rico, importação de arquivos, GitHub Releases e versionamento automático.

## Critério de aceite

O visitante vê apenas entradas publicadas, e o admin consegue gerenciar o conteúdo pela seção `Public`.

## Checklist

- [x] Listagem pública conectada
- [x] Detalhe público conectado
- [x] CRUD administrativo conectado
- [x] Stories atualizadas
- [x] Testes de ViewModel e API criados

## Notas da execução

- A listagem pública passou a consumir `GET /public/changelog` e exibe somente as entradas publicadas retornadas pela API.
- O detalhe por slug usa a mesma fonte de dados da listagem, preservando a navegação, busca e estado de item não encontrado.
- O conteúdo público agora usa título, resumo, corpo e tags reais da API. As traduções continuam reservadas aos textos da interface.
- A seção administrativa `Public > Changelog`, entregue no PUB-07, permanece conectada aos endpoints de criação, edição e visibilidade, incluindo publicação e arquivamento.
- Foram adicionados estados de carregamento, erro e slug inexistente, além de stories de lista, vazio, detalhe, loading, erro, não encontrado e português.
- Foram adicionados testes do serviço público e do ViewModel, cobrindo consulta, validação do endpoint e filtro de busca.
- _(suposição)_ A data exibida no frontend usa `publishedAt` e cai para `createdAt` quando a entrada ainda não possui data de publicação.
- _(suposição)_ O idioma da data segue o idioma atual da interface, sem armazenar uma versão traduzida no banco.
- _(suposição)_ O fallback de Storybook continua usando dados locais apenas para as stories, enquanto o fluxo da aplicação usa a API.

Validações executadas: `npm run repo:typecheck`, `npm run repo:lint`, `npm run repo:format-check`, `npm run client:test` e `npm run web:build`.
