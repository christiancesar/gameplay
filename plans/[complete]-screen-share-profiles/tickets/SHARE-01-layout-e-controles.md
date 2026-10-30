# SHARE-01 · Layout e controles de perfil

> Pontos: 3 · Depende de: nenhum · Status: concluído

## Contexto

O diálogo reserva três colunas para tipos de fonte mesmo quando só mostra tela e janela no desktop. Resolução e FPS ficam lado a lado, embora a resolução vá ganhar controles de altura e proporção.

## Escopo

- Fazer os cartões de fonte distribuírem igualmente a largura entre as opções renderizadas.
- Empilhar os grupos de resolução e FPS.
- Apresentar a seção de resolução com altura de qualidade e proporção 4:3, 16:10, 16:9 e 21:9, além de definir visualmente o estado de fonte nativa/automática para implementação no ticket seguinte.
- Manter o estado acessível e preparado para dados de recomendação e disponibilidade de FPS do ViewModel, sem inventar suporte de captura ainda.
- Atualizar inglês, português e stories dos estados alterados.

## Fora do escopo

- Declarar FPS avançado suportado antes da implementação de capacidades.
- Alterar os eventos de realtime, captura, bitrate ou codificação.

## Checklist

- [x] Cartões usam igualmente o espaço para duas ou três opções
- [x] Controles de resolução e FPS ficam em coluna
- [x] Stories cobrem desktop com dois tipos e navegador com três
- [x] Mensagens e rótulos estão em inglês e português
- [x] Typecheck, lint, formato, testes unitários e stories relevantes passam

## Critérios de aceite

- Nenhuma coluna vazia aparece quando um tipo de fonte é filtrado.
- A leitura da seção de vídeo é de cima para baixo: resolução e proporção, depois FPS.
- A View continua sem regras de negócio nem acesso a hardware.

## Notas da execução

- A grade agora calcula uma coluna por tipo de fonte efetivamente renderizado. No desktop, tela e janela ocupam metade da largura cada; no navegador, os três tipos dividem a largura.
- Resolução, proporção e taxa de quadros ficaram em blocos verticais. A View recebe disponibilidade e recomendação prontas do ViewModel.
- Foram acrescentados estados de Storybook para desktop com duas fontes, navegador com três e FPS avançado indisponível. O projeto Storybook passou com 287 testes.
- Rótulos e mensagens foram incluídos nos catálogos em inglês e português.
- A opção `Nativa` permanece ao lado de 4:3, 16:10, 16:9 e 21:9 para preservar a fonte sem forçar largura _(suposição)_.
