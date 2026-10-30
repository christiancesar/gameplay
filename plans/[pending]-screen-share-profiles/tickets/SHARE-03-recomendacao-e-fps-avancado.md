# SHARE-03 · Recomendações e FPS avançado

> Pontos: 5 · Depende de: SHARE-02 · Status: implementado, validação manual pendente

## Contexto

O coletor de hardware já observa codecs e eficiência estimada em 1080p60, mas não mede atualmente o refresh rate do display e não testa taxas acima de 60 FPS. A capacidade varia por fonte, sistema, browser, GPU e encoder.

## Escopo

- Obter, onde suportado, capacidades de captura da track e dados úteis do host Electron, sem tornar a transmissão dependente dessas APIs.
- Avaliar suporte e fluidez de codificação para os perfis relevantes, mantendo a matriz de avaliações pequena e documentada.
- Expor recomendação no ViewModel com motivo claro e fallback quando não houver dados.
- Oferecer 75, 100 e 120 FPS somente quando a captura e os sinais de codificação justificarem a disponibilidade; 30 e 60 continuam como opções-base.
- Conferir FPS real por `getSettings()` e estatísticas WebRTC. Não usar apenas refresh rate do monitor como prova de FPS de captura.
- Atualizar stories, i18n e testes para recomendação, falta de suporte e fallback.

## Fora do escopo

- Prometer FPS estável com base apenas em modelo de GPU, CPU ou refresh rate.
- Bloquear a pessoa de usar um perfil-base válido quando não há dados de hardware.

## Checklist

- [x] Recomendações funcionam com dados completos, parciais e indisponíveis
- [x] Opções 75/100/120 têm disponibilidade explícita e explicada
- [x] FPS solicitado e FPS observado são distinguidos
- [x] Testes cobrem captura/encoder sem suporte a taxas altas
- [x] Stories e mensagens em inglês e português atualizadas
- [x] Typecheck, lint, formato e testes relevantes passam
- [ ] Matriz manual de validação no Electron registra perfis recomendados e limites encontrados

## Critérios de aceite

- Ausência de `refreshRate`, MediaCapabilities ou APIs do track não impede iniciar transmissão.
- Uma taxa acima de 60 só aparece disponível com evidência local suficiente e ainda é identificada como alvo.
- A interface permite entender por que um perfil foi recomendado ou por que uma taxa não está disponível.

## Notas da execução

- O host Electron acrescenta largura, altura física e frequência às fontes de tela usando `screen.getAllDisplays()`. Janelas continuam sem dados inventados antes da captura.
- 30 e 60 FPS são opções-base. 75, 100 e 120 só são habilitados quando a fonte informa frequência suficiente e `MediaCapabilities.encodingInfo()` retorna codificação suportada e fluida para a dimensão e o bitrate calculados.
- Após iniciar a captura, `getCapabilities().frameRate.max` e `getSettings().frameRate` alimentam a disponibilidade e o valor observado. Falha ou ausência dessas APIs mantém o fallback em 30/60 sem impedir a transmissão.
- A recomendação escolhe a altura disponível, a proporção mais próxima e o maior FPS localmente habilitado. Ela é apresentada como recomendação, enquanto o painel continua mostrando o resultado medido _(suposição)_.
- Testes cobrem fonte 2560×1080 a 120 Hz, encoder fluido somente até 100 FPS e ausência total de sinais de hardware.
- A matriz manual completa ficou pendente porque a API de produção rejeita o perfil estruturado antes de a transmissão permanecer ativa. O caso 2560×1080 a 30 FPS foi confirmado na captura e na configuração inicial do SFU. Os FPS avançados e o uplink serão conferidos depois da atualização da API.
