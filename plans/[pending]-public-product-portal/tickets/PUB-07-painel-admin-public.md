# PUB-07 · Painel administrativo Public

> Pontos: 8 · Depende de: PUB-05 · Branch `feature/public-admin-panel`, saída da `dev`

## Escopo

- Adicionar a seção `Public` ao painel administrativo existente.
- Criar sidebar com Roadmap, Changelog, Feature requests e MCP.
- Criar Views, ViewModels, Screens, rotas e stories do painel.
- Permitir criação, edição, ordenação, publicação e arquivamento dos recursos editoriais.
- Reutilizar o guard de admin e 2FA já existente.

## Fora do escopo

MCP funcional, editor rico, GitHub e alterações na navegação pública fora dos callbacks necessários.

## Critério de aceite

Um admin com 2FA consegue acessar `/admin/public/*` e gerenciar os recursos disponíveis pela API, com stories dos estados principais.

## Checklist

- [x] Seção Public adicionada ao AdminLayout
- [x] Sidebar criada
- [x] Roadmap administrativo criado
- [x] Changelog administrativo criado
- [x] Feature requests administrativo criado
- [x] Rotas e stories criadas

## Notas da execução

- A seção `Public` foi adicionada ao painel administrativo existente, com sidebar para Roadmap, Changelog, Feature requests e MCP.
- O Roadmap permite criar, editar, ordenar, publicar e arquivar itens, usando a API administrativa e invalidação das queries após as mutações.
- O Changelog permite criar e editar entradas, incluindo tags informadas em uma lista separada por vírgulas, além de controlar a visibilidade.
- Feature requests podem ser revisadas, aprovadas ou rejeitadas, com vínculo opcional a um item do Roadmap.
- As rotas `/admin/public/roadmap`, `/admin/public/changelog`, `/admin/public/feature-requests` e `/admin/public/mcp` foram adicionadas sob o guard administrativo e 2FA já existente.
- Foram adicionadas stories para os estados principais das Views, incluindo estados vazios, edição, listagem e português.
- _(suposição)_ A tela de MCP permanece informativa neste ticket. A ativação e a operação do MCP ficam reservadas ao PUB-10.
- _(suposição)_ Arquivar um recurso usa `visibility: archived`, sem exclusão física do registro.
- _(suposição)_ O formulário de Changelog usa texto simples e tags separadas por vírgulas até a implementação de um editor rico em uma etapa futura.
- _(suposição)_ A moderação inicial de feature requests é representada pelas ações de aprovação e rejeição e pelo vínculo com Roadmap; os estados adicionais continuam suportados pela API.

Validações executadas: `npm run repo:typecheck`, `npm run repo:lint`, `npm run repo:format-check`, `npm run client:test` e `npm run web:build`.
