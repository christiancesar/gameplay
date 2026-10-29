# 02 · Tech Plan: perfis de qualidade para compartilhamento

> Data: 2026-10-28. Base: `00-requirements.md` e `01-epic-brief.md`. Tickets em `tickets/`.

## 1. Situação atual

- `packages/client/src/modules/screen-share/views/share-setup-dialog.view.tsx`: tipos de fonte em grade fixa de três colunas; resolução e FPS em duas colunas; opções de resolução 720p/1080p e FPS 30/60.
- `packages/client/src/modules/screen-share/model/entities/share.ts`: `ShareResolution` guarda apenas `720p | 1080p`; `ShareFps` guarda `30 | 60`.
- `packages/client/src/modules/screen-share/model/rules/preset.ts`: dimensão, FPS e bitrate estão fixados em quatro entradas `StreamPreset`. A entrada `1080p` usa 1920×1080.
- `packages/contracts/src/realtime/events.ts`: `STREAM_PRESETS` é uma enumeração compartilhada por `stream:start` e pelo estado `Participant.streaming`. API e client dependem desse contrato.
- `packages/client/src/modules/hardware/model/services/hardware-collector.service.ts`: testa `MediaCapabilities.encodingInfo` em 1920×1080 a 60 FPS. O relatório de telas grava `refreshRate: null`; portanto, refresh rate ainda não é fonte confiável para recomendação.
- Os dados observados durante a transmissão já incluem configurações reais da captura, estatísticas de saída WebRTC e camadas SFU. Devem continuar sendo a fonte para informar o resultado real.

## 2. Proposta de perfil

Modelar um perfil como dados estruturados em vez de acrescentar uma string para cada combinação de altura, proporção e FPS. Forma conceitual:

```ts
type ShareProfile = {
  height: 720 | 1080;
  aspectRatio: "source" | "4:3" | "16:10" | "16:9" | "21:9";
  fps: 30 | 60 | 75 | 100 | 120;
};
```

`source` representa a proporção nativa, para manter o quadro inteiro quando o aspecto da tela ou janela não coincide exatamente com 21:9. A largura é calculada a partir da altura e proporção, arredondada para uma dimensão compatível com o encoder, e limitada pelas dimensões reais da fonte quando necessário. A dimensão 2560×1080 deve ser preservada como caso de referência, apesar de sua razão real ser ligeiramente diferente de 21:9 nominal.

Antes do código, confirmar a política para uma proporção diferente da fonte. Recomendação deste plano: preservar o quadro inteiro e ajustar dentro da proporção selecionada, sem corte. Se a captura nativa não permitir esse ajuste, manter o aspecto nativo e informar a limitação, sem fazer processamento de canvas oculto nesta etapa.

## 3. Contrato e transmissão

- Atualizar o contrato compartilhado para representar altura, proporção e FPS na inicialização de stream e no estado do participante, em substituição à enumeração limitada, ou definir uma migração compatível se web e API puderem ser implantados em versões diferentes.
- Atualizar consumidores da API, testes de schemas e fábricas/fixtures do estado de participante. O valor continua nulo quando a pessoa não está transmitindo.
- Centralizar cálculo de largura, bitrate e parâmetros do encoder para evitar tabelas divergentes entre a interface, captura e publicação SFU/Mesh.
- Calcular bitrate usando pixels por segundo e limites de produto/rede, com teto explícito. A proporção ultrawide em 1080p contém mais pixels que 1920×1080 e não deve reutilizar cegamente o mesmo bitrate.
- Aplicar o perfil calculado nas constraints iniciais e nas mudanças de uma stream ativa. Tratar constraints como alvo e ler `MediaStreamTrack.getSettings()` depois da captura e de `applyConstraints()`.
- Manter a configuração das camadas simulcast e da assinatura de espectadores coerente com o perfil máximo publicado, sem quebrar a camada de baixa resolução.

## 4. Recomendação de hardware e FPS

- Testar `MediaCapabilities.encodingInfo` para combinações relevantes de resolução/FPS e codecs disponíveis, ou usar uma matriz pequena de testes representativos. Reutilizar os indicadores `supported`, `smooth` e `powerEfficient` como sinais, não como garantia.
- Consultar `MediaStreamTrack.getCapabilities()` quando suportado e verificar `getSettings()` para a taxa efetiva da captura.
- Investigar a leitura do refresh rate e das dimensões do display no host Electron. O coletor atual não envia refresh rate; telas não autorizadas também podem não expor nomes ou dimensões.
- Para janela/jogo, não inferir FPS de captura apenas do refresh rate do monitor. Filtrar opções com base nas capacidades da track e do encoder e validar o resultado durante a transmissão.
- Manter 30 e 60 como opções base. Só habilitar 75/100/120 quando os sinais locais forem suficientes. Sem dados conclusivos, esconder ou desabilitar a opção com explicação traduzida e fallback para 60.
- A recomendação deve tolerar ausência ou falha de APIs de hardware e não impedir iniciar uma transmissão com uma configuração manual válida.

## 5. Interface e MVVM

- Tipos de fonte: derivar o número de colunas das opções apresentadas, evitando colunas reservadas para opções filtradas. Manter layout responsivo em largura pequena.
- Resolução e FPS: empilhar os grupos verticalmente. A seção de resolução mostra altura de qualidade e proporção; a seção de FPS permanece separada.
- A View recebe estados e callbacks. Regras de recomendação, combinações disponíveis e dimensões calculadas ficam no Model/serviço e são orquestradas pelo ViewModel.
- Acrescentar todas as mensagens em `packages/client/src/shared/i18n/locales/en.json` e `pt.json`.
- Atualizar stories das Views alteradas, cobrindo duas/três fontes, combinações de proporção, recomendação e opções de FPS indisponíveis.
- Evitar consultar diretamente APIs de hardware dentro da View. Captura e capacidades passam pelos serviços de Model e pela `Platform` quando dependerem do host.

## 6. Sequência sugerida

1. Ajustar o layout e montar a UI de perfil com estados acessíveis, mantendo por enquanto a seleção suportada atual.
2. Alterar entidades, regras de dimensão/bitrate e contratos de realtime; atualizar captura, publicação SFU/Mesh e estado dos participantes.
3. Adicionar recomendação e disponibilidade dinâmica dos FPS avançados, incluindo os dados de hardware que possam ser coletados e o retorno visual da qualidade observada.

## 7. Decisões tomadas na implementação

- A captura preserva o conteúdo original, sem corte, barras ou processamento por canvas. As constraints pedem a dimensão-alvo, mas a aplicação mostra a dimensão efetiva quando o host mantém outro aspecto _(suposição)_.
- `stream:start` e `Participant.streaming` aceitam o objeto estruturado novo e as quatro strings legadas. A API precisa ser publicada antes de um client novo transmitir um perfil estruturado em produção.
- 30 e 60 FPS permanecem habilitados. 75, 100 e 120 exigem frequência suficiente na fonte e resposta `supported` e `smooth` de `MediaCapabilities.encodingInfo()` para o perfil calculado.
- O Electron fornece dimensões físicas e `displayFrequency` para telas. Janelas não recebem valores inferidos. Depois da captura, `getCapabilities()` e `getSettings()` registram capacidade e resultado reais.

## 8. Resultado e validação

- SHARE-01 foi concluído. SHARE-02 e SHARE-03 estão implementados e aguardam a matriz manual de transmissão.
- Typecheck e lint passaram nos workspaces afetados. Client: 1.039 testes unitários. Storybook: 287 testes. Desktop: 125 testes. Desktop bridge: 13 testes.
- O pacote Windows foi construído e abriu em `app://gameplay` sem exceções no renderer. O teste capturou Dota 2 em 2560×1080 a 30 FPS e configurou a camada SFU principal com escala 1 e 7,5 Mbps. A API de produção desatualizada rejeitou o perfil estruturado em `stream:start` e a sessão foi encerrada. Não foi adicionado fallback por decisão do usuário; a transmissão completa será repetida depois do merge e do deploy da API.
- O modo dev em `http://localhost:5173` continua bloqueado pela política CORS da instância de produção, como esperado.
- Banco, Docker e e2e de API não fazem parte desta validação, conforme orientação do usuário.
