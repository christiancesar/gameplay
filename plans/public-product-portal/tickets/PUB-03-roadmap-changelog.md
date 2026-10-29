# PUB-03 · Roadmap e Changelog estáticos

> Pontos: 8 · Depende de: PUB-01 · Branch `feature/public-portal-storybook`, saída da `dev`

## Escopo

- Criar Roadmap estático com grupos de status e cards.
- Criar Changelog com listagem, busca visual e detalhe de entrada.
- Criar seeds tipados separados das Views.
- Criar stories para estados vazio, normal e item selecionado.
- Usar conteúdo em português e inglês pelo sistema de i18n quando o texto for de interface.
- Deixar o modelo preparado para votos e solicitações futuros, sem implementar persistência.

## Fora do escopo

Votos, formulário de feature request, integração com GitHub Projects, CMS e API.

## Critério de aceite

Roadmap e Changelog funcionam no Storybook como páginas estáticas navegáveis por callbacks e podem ser revisados visualmente antes da criação das rotas reais.

## Notas da execução

- Criadas entidades e seeds separados para Roadmap e Changelog, sem persistência ou chamadas de API.
- Criada `PublicRoadmapView` com quatro grupos de status, contagem por coluna, cards e estado vazio implícito.
- Criada `PublicChangelogView` com listagem, busca visual, seleção por callback e detalhe de entrada.
- Criadas stories para estado normal, vazio, item selecionado e português.
- _(suposição)_ As datas, versões e textos dos seeds são conteúdo editorial temporário para revisão visual.
- _(suposição)_ A busca permanece visual nesta etapa e será conectada ao ViewModel quando as rotas públicas forem implementadas.

## Checklist

- [x] Roadmap estático criado com grupos de status e cards
- [x] Changelog criado com listagem, busca visual e detalhe
- [x] Seeds tipados separados das Views
- [x] Stories para estados vazio, normal e item selecionado
- [x] Conteúdo de interface disponível em português e inglês
- [x] Modelo preparado para integrações futuras, sem persistência
