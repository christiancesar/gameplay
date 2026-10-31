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

- [ ] Listagem pública conectada
- [ ] Detalhe público conectado
- [ ] CRUD administrativo conectado
- [ ] Stories atualizadas
- [ ] Testes de ViewModel e API criados
