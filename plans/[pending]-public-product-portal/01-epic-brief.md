# 01 · Epic Brief: portal público do Gameplay

## 1. Visão

O Gameplay precisa de uma tela principal que explique o produto e seja o ponto de entrada para usuários novos. Essa tela deve levar naturalmente ao login, ao Hub, ao download do app e às informações públicas sobre o futuro do produto.

## 2. Experiência

```text
Home
  ├─ conhecer o produto
  ├─ baixar o app
  ├─ ver o roadmap
  ├─ ler o changelog
  └─ entrar ou criar conta

Usuário autenticado
  └─ Hub ou escolha de servidor
```

## 3. Direção visual

- Página limpa, com bastante espaço e navegação discreta.
- Referência estrutural no Notion, sem reproduzir marca, textos ou identidade visual.
- Roadmap com agrupamentos de status e cards fáceis de escanear.
- Changelog com hierarquia editorial semelhante ao Expo: data, título, resumo, autor opcional e detalhe. A referência é a organização pública do [Expo Changelog](https://expo.dev/changelog).
- Paleta existente do Gameplay, tipografia e componentes shadcn já adotados.

## 4. Administração e automação

O painel administrativo terá uma seção **Public**, com uma sidebar própria para os recursos editoriais do produto:

- Roadmap: criar, editar, ordenar, publicar, arquivar e atualizar status.
- Changelog: criar, editar, publicar e arquivar entradas.
- Feature requests: revisar, aprovar, rejeitar, arquivar e vincular solicitações ao roadmap.
- MCP: ativar e encerrar a automação local, mostrando o endpoint e o token temporário enquanto a sessão estiver ativa.

Roadmap, changelog, solicitações e votos terão o banco de dados como fonte de verdade. O MCP reutilizará os mesmos casos de uso e regras do painel, sem acesso direto ao Prisma.

## 5. Evolução posterior

- Sincronização seletiva com GitHub Projects, sem expor a organização interna.
- Exportação ou importação editorial, caso seja necessária no futuro.

## 6. Critério de sucesso

Um visitante deslogado entende o produto, encontra o download adequado, consegue entrar ou criar conta e pode consultar roadmap e changelog sem depender do servidor do Gameplay.
