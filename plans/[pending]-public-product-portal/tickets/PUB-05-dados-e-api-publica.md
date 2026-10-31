# PUB-05 · Dados e API do conteúdo público

> Pontos: 8 · Depende de: PUB-04 · Branch `feature/public-content-api`, saída da `dev`

## Escopo

- Criar os modelos Prisma de roadmap, changelog, solicitações e votos.
- Criar contratos Zod compartilhados e mappers.
- Criar leituras públicas para roadmap e changelog publicado.
- Criar ações autenticadas para votos e solicitações.
- Criar endpoints administrativos para conteúdo e moderação, protegidos por admin com 2FA.
- Cobrir regras de unicidade de voto, publicação e autorização.

## Fora do escopo

Views, rotas do painel, MCP, sincronização com GitHub e editor rico.

## Critério de aceite

Os dados públicos podem ser lidos sem sessão, votos e solicitações exigem usuário autenticado, e alterações editoriais exigem admin da plataforma com 2FA.

## Checklist

- [x] Modelos e migration criados
- [x] Contratos compartilhados criados
- [x] API pública criada
- [x] API autenticada criada
- [x] API administrativa criada
- [x] Testes unitários e e2e criados

## Notas da execução

- Criados os modelos Prisma `RoadmapItem`, `ChangelogEntry`, `FeatureRequest` e `FeatureVote`, com enums de status, visibilidade, índices e unicidade de voto.
- Criada a migration `20261030210000_public_content`, aplicada nos bancos de desenvolvimento e e2e.
- Criados os contratos Zod compartilhados em `packages/contracts/src/public/content.ts`.
- Criado o módulo `public-content` da API com leituras públicas, votos e solicitações autenticadas, além do CRUD editorial e moderação protegidos por admin com 2FA.
- A leitura pública retorna apenas conteúdo publicado. Quando há sessão, o roadmap também informa se o usuário já votou em cada item.
- A tentativa de voto duplicado responde `409 FEATURE_VOTE_ALREADY_EXISTS`.
- Criados testes unitários da regra de publicação e e2e para leitura pública, publicação, autenticação, voto único e feature requests.
- _(suposição)_ O changelog usa texto editorial persistido diretamente no banco, sem chaves de i18n, porque seu conteúdo é publicado pelo admin e não faz parte da interface fixa.
- _(suposição)_ A remoção de voto retorna `200` com a contagem atualizada para permitir atualização otimista posterior no ViewModel.
- _(suposição)_ A exclusão editorial não foi exposta neste ticket; arquivamento por `visibility` ou `status` preserva o histórico e será usado pelo painel.
