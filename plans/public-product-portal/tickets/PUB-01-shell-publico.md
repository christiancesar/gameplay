# PUB-01 · Shell público e navegação

> Pontos: 5 · Depende do frontend atual · Branch `feature/public-portal-storybook`, saída da `dev`

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

## Checklist

- [x] Navegação pública criada com `NavigationMenu` do shadcn
- [x] Stories desktop e mobile criadas
- [x] Estados deslogado e logado cobertos
- [x] Callbacks de navegação criados
- [x] View independente de Router
- [x] Interações da story validadas

## Notas da execução

- Criado `PublicNavigationView` com navegação desktop pelo `NavigationMenu` e navegação compacta horizontal no mobile.
- Adicionados estados deslogado e logado, callbacks de destino e stories com interação e idioma português.
- Adicionado o componente oficial `NavigationMenu` do shadcn ao pacote client.
- Adicionados ao header público os controles de tema e idioma, além do botão `Sign in` para usuários deslogados e `Open Hub` para usuários autenticados.
- _(suposição)_ O CTA de usuário deslogado leva primeiro para `/sign-in`; o cadastro continua acessível pela tela de login.
- _(suposição)_ No mobile, uma navegação horizontal compacta é mais apropriada que abrir o viewport completo do `NavigationMenu`.
