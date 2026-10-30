# PUB-04 · Rotas públicas e integração de sessão

> Pontos: 5 · Depende de: PUB-02, PUB-03 · Branch `feature/public-portal-storybook`, saída da `dev`

## Escopo

- Transformar Home, Downloads, Roadmap e Changelog em rotas públicas reais.
- Mover o Hub autenticado de `/` para `/hub`, preservando a proteção do layout autenticado.
- Conectar a navegação pública aos destinos reais, incluindo login, cadastro e Hub.
- Criar detalhe de Changelog em `/changelog/:slug`.
- Preservar tema, idioma e estado deslogado/logado no shell público.

## Fora do escopo

Dados remotos, S3, feed Squirrel, votos, feature requests, GitHub Projects e CMS.

## Critério de aceite

As páginas públicas funcionam no router real, visitantes deslogados conseguem navegar entre elas e usuários autenticados chegam ao Hub em `/hub`.

## Checklist

- [x] Home pública em `/`
- [x] Downloads em `/download`
- [x] Roadmap em `/roadmap`
- [x] Changelog em `/changelog` e `/changelog/:slug`
- [x] Hub autenticado em `/hub`
- [x] Redirecionamentos de autenticação atualizados
- [x] Testes e build validados

## Notas da execução

- Criadas as rotas reais da Home, Downloads, Roadmap, Changelog e detalhe do Changelog.
- O Hub autenticado foi movido de `/` para `/hub`; o fallback de autenticação também aponta para `/hub`.
- A navegação pública usa ViewModels para sessão, tema, idioma, seleção de Changelog e dados estáticos.
- Entradas nas rotas públicas redirecionam para `/sign-in` quando o host é o Desktop. O portal público é uma experiência do Web.
- _(suposição)_ O download continua usando callback sem URL real até a integração com S3 e o endpoint de releases.
- _(suposição)_ A separação atual protege o fluxo em runtime pelo `Platform.kind`; uma separação futura de bundles poderá mover o router público para uma entrada exclusiva do Web.
