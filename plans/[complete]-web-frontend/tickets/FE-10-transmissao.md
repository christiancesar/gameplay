# FE-10 · Compartilhar e assistir tela

> Pontos: 8 · Modelo sugerido: Opus · Depende de: FE-09 · Onda 6

## Contexto
Quem transmite escolhe preset e áudio antes do seletor do browser. Quem assiste só recebe depois de clicar em "Assistir" (`?watch=<userId>`).

## Escopo
- Modal de compartilhamento: superfície (`displaySurface`), preset (720p/1080p, 30/60), áudio, "usar da próxima vez".
- `getDisplayMedia`, faixas no `MeshTransport`, troca de preset ao vivo (`applyConstraints` + `setParameters`), parar pelo painel ou pelo browser.
- Monitor: alvo e entregue (pior espectador), taxa de envio, motivo da limitação (`qualityLimitationReason`), espectadores e detalhes por espectador.
- Assistir: selo LIVE, `?watch=`, faixa de participantes, trocar entre transmissões, tela cheia, volume separado; fechar quando quem transmite para.

## Fora do escopo
Seletor de qualidade do espectador (decisão pendente em `media-transport-options.md` seção 6, item 7).

## Referências
- `plans/[complete]-core-product/02-core-flows.md` F9, F10
- `plans/[complete]-core-product/00-requirements.md` 3.1.1
- `modules/screen-share/views`

## Checklist
- [x] Rules das estatísticas (alvo, entregue, motivo) como funções puras com testes
- [x] ViewModels com `.spec.ts`
- [x] Teste manual com dois browsers
- [x] Commit

## Critério de aceite
Transmitir em cada preset, assistir, trocar preset ao vivo e parar funcionam entre dois browsers, e o monitor mostra números reais.

## Notas da execução (2026-10-25)

Feito por um agente Sonnet, em paralelo com o outro ticket da onda (FE-10 e FE-13), na branch `feature/web-routing`. Os dois pararam no meio pelo limite de uso da API e foram retomados. Revisado pelo Opus: web 1105 testes, api 282, lint e typecheck verdes.

- `MediaTransport` marca cada faixa remota como `voice` ou `screen` (o primeiro transceiver é a voz; vídeo é sempre tela), então o áudio da tela nunca toca como voz. Ganhou `setVideoEncoding` e `getSenderStats`.
- `ShareSession` (quem transmite): seletor do browser, `stream:start`, troca de preset ao vivo (`applyConstraints` + `setParameters`), parar pelo painel ou pelo botão do browser (`onended`), `getStats` por espectador a cada segundo. As faixas só vão para quem pediu para assistir (`stream:watch-request`) e saem no `stream:unwatch`.
- `WatchSession` (quem assiste): uma tela por vez, áudio da tela com volume próprio, fecha quando a transmissão para e pede de novo se a conexão de quem transmite volta.
- `?watch=` é a fonte da verdade; a URL limpa quando a transmissão acaba.
- Views: `ShareSetupDialogView` ganhou o modo `update` (trocar qualidade ao vivo) e `SharePanelView` o `onChangeQuality`; `StreamVideoView` nova, com story.
- Teste manual com dois Chromium headless e tela falsa: quem assiste recebe vídeo (`framesDecoded` 96, 480x270), o monitor mostra alvo, entregue e motivo da limitação, e parar pelo painel fecha a tela de quem assiste.

Suposições *(confirmar)*:
- Tetos de bitrate por preset: 2,5, 4, 5 e 8 Mbps (720p30, 720p60, 1080p30, 1080p60). *(suposição)*
- Áudio por superfície: aba tem, tela inteira só no Windows (só informativo), janela não tem. Sem detecção do sistema. *(suposição)*
- "Entregue" é o pior espectador; o envio é a soma de todos. *(suposição)*
- Volume da tela de 0 a 100, só na memória; deafen também cala o áudio da tela. *(suposição)*
- Sem preferência de codec, sem ajuste de Opus para áudio de jogo e sem `jitterBufferTarget`: o browser escolhe. *(suposição)*
- Prioridade: a View não tinha controle; o ajuste seguinte (commit `8d204bf`) pôs a escolha "Fluido" ou "Nítido" no diálogo, no início e ao vivo, salva com o "usar da próxima vez". Os nomes dos rótulos são do agente. *(suposição)*
- Não testado: botão "parar" do próprio browser (só spec), tela e áudio reais, 1080p60 sustentado e codec por hardware.
