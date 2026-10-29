# 01 · Epic Brief: perfis de qualidade para compartilhamento

> Data: 2026-10-28. Base: `00-requirements.md`.

## Resumo

Dar à pessoa controle claro sobre altura de qualidade e proporção do compartilhamento, recomendar opções com base nas capacidades disponíveis e mostrar a qualidade real enviada. Corrigir também o espaço vazio na escolha do tipo de fonte e empilhar os controles de vídeo.

## Contexto e problema

O diálogo atual apresenta 720p/1080p e 30/60 FPS lado a lado. O perfil de 1080p é fixo em 1920×1080. Na investigação da transmissão, uma fonte ultrawide de 2560×1080 foi capturada em 1920×810 e enviada como uma camada de 1920×808, aproximadamente 30 FPS. Isso é coerente com o limite de largura atual de 1920 pixels e a preservação da proporção da fonte. Embora 810 linhas correspondam a uma imagem ultrawide, o perfil atual não usa a altura total de 1080 linhas disponível no monitor.

O seletor de tipo de fonte também usa sempre três colunas. No desktop só há tela e janela, então fica uma coluna vazia e os cartões parecem incompletos.

## O que entrega

- Layout que distribui os cartões entre os tipos realmente apresentados e põe resolução e FPS em uma coluna.
- Perfis definidos por altura, proporção e FPS, em vez de assumir que “1080p” sempre significa 1920×1080.
- Captura e configuração do encoder que usem a dimensão-alvo calculada e respeitem limites reais da fonte e da plataforma.
- Recomendação de perfil baseada em dados de hardware e capacidade de codificação disponíveis, com fallback quando esses dados não existem.
- Suporte avaliado para 75, 100 e 120 FPS, habilitado apenas quando a captura e a codificação conseguem sustentar a opção.
- Indicação do perfil solicitado e medidas reais de captura e transmissão.

## Critério de sucesso

- Com duas opções de fonte, elas dividem igualmente o espaço; com três, as três dividem o espaço.
- Uma tela 2560×1080 pode produzir captura 2560×1080 no perfil 1080p ultrawide, se captura, encoder, camada SFU e banda permitirem.
- O perfil selecionado, a captura e os parâmetros de codificação permanecem coerentes durante início e atualização da transmissão.
- A recomendação não depende de campos de hardware ausentes. Taxas avançadas não são apresentadas como disponíveis sem indicação suficiente de suporte.
- A qualidade enviada pode ser comparada com o perfil pedido através dos dados já medidos pelo app.

## Riscos

- Constraints de `getDisplayMedia` são sugestões e podem não produzir a dimensão solicitada. A saída deve sempre ser confirmada pelas configurações da track e pelas estatísticas WebRTC.
- Forçar proporção diferente da fonte pode cortar conteúdo ou criar barras. A escolha de comportamento precisa ser confirmada antes de implementar o processamento visual.
- Aumentar a largura de 1920 para 2560 aumenta a quantidade de pixels e a necessidade de bitrate. Não basta alterar o limite de largura; o orçamento do encoder e as camadas SFU precisam ser recalculados e exercitados.
- O contrato atual de realtime usa uma enumeração fixa de perfis 720p/1080p a 30/60 FPS. Taxas e proporções novas exigem uma representação compartilhada compatível entre client, contracts e API.
- Monitor, janela e jogo podem expor capacidades diferentes. Refresh rate do monitor, sozinho, não comprova que a fonte ou o encoder consigam gerar todos esses quadros.
