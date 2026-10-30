# SHARE-02 · Perfil, contrato e codificação

> Pontos: 8 · Depende de: SHARE-01 · Status: implementado, validação manual pendente

## Contexto

O contrato atual enumera quatro combinações fixas. O cálculo de resolução também fixa 1080p em 1920×1080, o que reduz uma fonte 2560×1080 para aproximadamente 1920×810.

## Escopo

- Representar altura, proporção e FPS como perfil estruturado, incluindo estado padrão/migração das preferências salvas.
- Atualizar schemas, tipos e consumidores de `stream:start` e `Participant.streaming` entre contracts, client e API.
- Calcular dimensões-alvo a partir da altura e proporção, arredondar para dimensões suportadas e respeitar o tamanho real da fonte. Cobrir 2560×1080 como caso de ultrawide.
- Recalcular bitrate e camadas de vídeo de acordo com pixels por segundo e limites definidos, mantendo consistência em captura, publicação SFU e Mesh e seleção de qualidade do espectador.
- Aplicar o perfil ao iniciar e atualizar transmissão. Mostrar a diferença entre alvo e dimensões efetivamente capturadas/enviadas.
- Atualizar testes de regras, schemas e integração afetada.

## Fora do escopo

- Habilitar automaticamente 75, 100 ou 120 FPS sem sinais de capacidade suficientes.
- Reprocessar vídeo com canvas para cortar ou colocar barras antes de a política de proporção ser confirmada.

## Checklist

- [x] Contratos e payloads representam o perfil de ponta a ponta
- [x] Preferências antigas recebem defaults válidos
- [x] Cálculos preservam a altura ultrawide disponível quando a fonte permite
- [x] Bitrate e camadas são coerentes com o perfil solicitado
- [x] Saída observada é comparável ao perfil solicitado
- [x] Typecheck, lint, formato e testes relevantes passam
- [ ] Teste manual no Electron registra captura e uplink para 16:9 e 21:9

## Critérios de aceite

- Uma tela 2560×1080 pode ser capturada e publicada nessa dimensão para o perfil 1080p ultrawide quando a plataforma suportar.
- Se a captura não alcançar o perfil, a aplicação mostra a dimensão real e não a rotula como dimensão garantida.
- Client e API interpretam o mesmo perfil, e participantes que não estão transmitindo continuam com `streaming: null`.

## Notas da execução

- O contrato passou a aceitar o perfil estruturado `{ height, aspectRatio, fps }`. As quatro strings antigas continuam válidas durante a migração, para leitura e implantação gradual.
- O perfil 1080p 21:9 calcula 2560×1080. Constraints, bitrate, simulcast, Mesh e mudança de qualidade usam a mesma regra. O bitrate varia por pixels por segundo e tem teto de 20 Mbps.
- Preferências salvas antes de `aspectRatio` recebem `source` por meio do merge com os defaults, sem perder fonte, áudio ou prioridade.
- O painel compara o alvo com `getSettings()` e com as estatísticas WebRTC, mostrando dimensões e FPS observados. Constraints continuam sendo uma solicitação, não uma garantia.
- A política implementada preserva a fonte e não adiciona corte, barras ou canvas oculto. Quando o host ignora a proporção solicitada, a dimensão real fica visível _(suposição)_.
- O pacote Windows foi gerado em `apps/desktop/out/gameplay-win32-x64` e abriu em `app://gameplay` sem erro de CORS ou exceção no renderer.
- No teste manual, a janela Dota 2 foi capturada em 2560×1080 a 30 FPS. A camada SFU principal recebeu escala 1, 7,5 Mbps e 30 FPS, confirmando que o limite anterior de 1920×810 saiu do app.
- A transmissão foi desmontada depois de `stream:start`, pois a API de produção ainda usa o contrato antigo e rejeita o objeto de perfil novo. Por decisão do usuário, não foi criado fallback no desktop. A validação de uplink e espectador será repetida depois do merge e da atualização da API.
- Não foram executados banco, Docker nem e2e de API, conforme orientação do usuário.
