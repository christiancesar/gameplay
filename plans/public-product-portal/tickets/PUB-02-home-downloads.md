# PUB-02 · Home e Downloads estáticos

> Pontos: 5 · Depende de: PUB-01 · Branch `feature/public-home-downloads`, saída da `dev`

## Escopo

- Criar a Home pública inspirada na estrutura da referência fornecida.
- Criar a página de Downloads em `/download` como View e story.
- Exibir Windows e Linux, com recomendação por sistema quando possível.
- Mostrar CTA de login/cadastro para usuário deslogado e Hub para usuário logado.
- Usar constantes tipadas para os downloads, sem chamadas de API.
- Preparar URLs para S3 ou endpoint estável sem fixar a implementação final.

## Fora do escopo

Detecção perfeita de sistema, feed Squirrel, assinatura, conexão real com S3 e rotas finais.

## Critério de aceite

As stories cobrem Home e Downloads para os principais sistemas e estados de sessão, com conteúdo estático revisável pelo usuário.
