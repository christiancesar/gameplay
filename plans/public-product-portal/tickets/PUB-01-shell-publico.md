# PUB-01 · Shell público e navegação

> Pontos: 5 · Depende do frontend atual · Branch `feature/public-portal-shell`, saída da `dev`

## Escopo

- Criar a navegação pública com `NavigationMenu` do shadcn, se o layout validar o componente.
- Criar stories da navegação em desktop e mobile.
- Adicionar estados deslogado e logado por props.
- Criar callbacks para Home, Downloads, Roadmap, Changelog, login, cadastro e Hub.
- Manter a View independente de Router.

## Fora do escopo

Rotas reais, conteúdo final da Home, dados do S3, votos e GitHub Project.

## Critério de aceite

O shell público funciona isoladamente no Storybook, com navegação simulada e sem dependência de autenticação ou Router.
