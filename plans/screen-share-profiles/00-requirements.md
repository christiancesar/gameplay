# 00 · Requisitos: perfis de qualidade para compartilhamento

> Data: 2026-10-28. Status: **implementado, validação manual da transmissão pendente**.

## 1. Visão

Melhorar a configuração e a qualidade do compartilhamento de tela no desktop e no navegador. A pessoa escolhe a altura de qualidade, a proporção e a taxa de quadros. A interface deve usar o espaço disponível e recomendar opções compatíveis com a fonte e o hardware, sem apresentar uma qualidade maior do que a transmissão realmente entrega.

## 2. Requisitos funcionais

- Os cartões de tipo de fonte ocupam igualmente a largura disponível. Com duas fontes ativas, cada cartão usa metade do espaço; com três, cada um usa um terço. Tipos indisponíveis não deixam colunas vazias.
- Os controles de resolução e taxa de quadros ficam empilhados verticalmente.
- A resolução representa a altura-alvo de qualidade, inicialmente 720p ou 1080p, combinada com uma proporção selecionável. As proporções iniciais são 4:3, 16:10, 16:9 e 21:9.
- O perfil ultrawide deve poder usar a altura completa de uma tela de 2560×1080. A saída não deve ser limitada silenciosamente a 1920 pixels de largura e acabar em 1920×810 quando a fonte oferece a resolução maior.
- A interface mostra recomendações de resolução, proporção e FPS com base nas capacidades detectáveis da fonte, do dispositivo e do encoder. Uma recomendação é uma estimativa, não uma garantia da qualidade recebida por todos os espectadores.
- 30 e 60 FPS permanecem opções disponíveis. Avaliar 75, 100 e 120 FPS nesta implementação. Só oferecer cada taxa quando houver capacidade de captura e codificação compatível; confirmar a taxa real pelas configurações da track e pelas estatísticas WebRTC.
- A aplicação informa o perfil solicitado e a resolução/FPS efetivamente capturados e enviados, para que uma limitação seja visível durante a transmissão.
- Os perfis funcionam ao iniciar e ao atualizar uma transmissão em andamento, respeitando limitações do navegador, sistema, fonte, encoder, SFU e banda.
- A configuração salva existente migra para valores padrão válidos sem perder áudio, prioridade ou tipo de fonte.

## 3. Requisitos de interface e acessibilidade

- Os cartões de fonte conservam a semântica e a navegação por teclado do grupo de opções atual.
- A opção recomendada é identificada e explicada em inglês e português. A pessoa ainda pode escolher manualmente qualquer perfil que esteja disponível.
- Uma opção não suportada não deve parecer selecionável. Se uma limitação surgir depois do início, explicar a diferença entre o perfil solicitado e a saída observada.
- Views novas ou com estados novos incluem stories. Todo texto visível usa i18n em inglês e português.

## 4. Fora do escopo

- Prometer determinada resolução ou taxa recebida por todos os espectadores, independentemente de rede e capacidade de decodificação.
- Adicionar opções acima de 120 FPS nesta etapa.
- Mudar áudio, seleção de fonte, modos SFU/Mesh ou o orçamento de mídia, exceto pelos ajustes necessários para transmitir o perfil selecionado.

## 5. Decisões adotadas

- O conteúdo é preservado sem corte e sem processamento por canvas. A dimensão real é mostrada se a plataforma não aplicar o aspecto solicitado _(suposição)_.
- A opção `Nativa` aparece junto às quatro proporções e evita forçar uma largura.
- As taxas de 75, 100 e 120 FPS entram com disponibilidade calculada em runtime e confirmação posterior pela track e pelas estatísticas. A matriz manual no Electron continua pendente.
