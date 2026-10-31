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

- [ ] Seção Public adicionada ao AdminLayout
- [ ] Sidebar criada
- [ ] Roadmap administrativo criado
- [ ] Changelog administrativo criado
- [ ] Feature requests administrativo criado
- [ ] Rotas e stories criadas
