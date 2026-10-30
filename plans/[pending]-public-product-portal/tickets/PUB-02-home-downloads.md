# PUB-02 · Home e Downloads estáticos

> Pontos: 5 · Depende de: PUB-01 · Branch `feature/public-portal-storybook`, saída da `dev`

## Escopo

- Criar a Home pública inspirada na estrutura da referência fornecida.
- Criar a página de Downloads em `/download` como View e story.
- Exibir Windows e Linux, com recomendação por sistema quando possível.
- Mostrar CTA de login/cadastro para usuário deslogado e Hub para usuário logado.
- Usar constantes tipadas apenas como fallback de desenvolvimento e Storybook.
- Preparar a View para receber versão, URLs e disponibilidade por props.

## Fora do escopo

Detecção perfeita de sistema, feed Squirrel, assinatura, conexão real com S3 e rotas finais.

## Critério de aceite

As stories cobrem Home e Downloads para os principais sistemas e estados de sessão, com conteúdo estático revisável pelo usuário.

## Notas da execução

- Criada `PublicHomeView` com hero responsivo, painel visual de uma sala e CTAs para login, Hub e Downloads.
- Criada `PublicDownloadView` com opções de Windows e Linux, recomendação por sistema e callbacks de download.
- Criados seeds e entidades tipadas para as opções de download, sem chamadas de API ou dependência real do S3.
- URLs reais ficaram fora da View. A integração futura usará a página `/download`, um manifesto público de downloads e o feed técnico separado do `autoUpdater`.
- Adicionados estados deslogado, logado, Windows recomendado, Linux recomendado, sistema desconhecido e português no Storybook.
- _(suposição)_ A versão estática exibida nos cards é `0.0.2`, apenas como fallback visual até a fonte de releases ser conectada.
- _(suposição)_ O download continua acionando `onDownload` nesta etapa, sem abrir uma URL real, porque o S3 ainda não foi conectado.

## Checklist

- [x] Home pública criada
- [x] Página de Downloads criada como View e story
- [x] Windows e Linux exibidos
- [x] Recomendação por sistema representada por prop
- [x] CTAs para usuário logado e deslogado
- [x] Seeds tipados sem chamadas de API
- [x] Stories de interação, responsividade e português criadas

