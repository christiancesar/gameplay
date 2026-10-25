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
- `plans/02-core-flows.md` F9, F10
- `plans/00-requirements.md` 3.1.1
- `modules/screen-share/views`

## Checklist
- [ ] Rules das estatísticas (alvo, entregue, motivo) como funções puras com testes
- [ ] ViewModels com `.spec.ts`
- [ ] Teste manual com dois browsers
- [ ] Commit

## Critério de aceite
Transmitir em cada preset, assistir, trocar preset ao vivo e parar funcionam entre dois browsers, e o monitor mostra números reais.
