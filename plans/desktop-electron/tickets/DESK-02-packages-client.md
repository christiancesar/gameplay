# DESK-02 · Front-end em `packages/client`

> Pontos: 8 · Depende de: DESK-01 · Branch `feature/desktop-client-package`, saída da `dev`

## Contexto
Plano em `../02-tech-plan.md` (decisões, arquitetura e source tree alvo, seção 5). O app desktop vai rodar o mesmo front-end do web. Para isso o código de `apps/web/src` sai do app e vira o pacote `@gameplay/client`, consumido pelo web agora e pelo desktop no DESK-05.

## Escopo
- Criar `packages/client` (`@gameplay/client`) e mover para ele, com `git mv` para manter o histórico: `src/app` (com `routes/` e `route-tree.gen.ts`), `src/modules`, `src/shared`, `src/fixtures`, `src/docs` e o tema que hoje está no `index.css`.
- O pacote exporta o código-fonte, sem build: o Vite de cada casca compila o TypeScript dele.
- `apps/web` vira casca: `main.tsx` montando o `App` do pacote, `index.css` importando o tema e com `@source` para o pacote, `index.html`, `vite.config.ts` (React, Tailwind, router plugin com `routesDirectory` e `generatedRouteTree` no pacote, Sentry, proxy de `/api`).
- Storybook e Vitest (projetos `unit` e `storybook`) vão para o pacote. `npm run storybook` e `npm test` na raiz continuam funcionando.
- `components.json` do shadcn passa a apontar para o pacote.
- Aliases: o `@/` de hoje passa a resolver para `packages/client/src` nos dois lados (pacote e casca), sem reescrever imports.
- `oxlint` e `oxfmt` com a configuração do web levada para o pacote.
- `apps/web/Dockerfile` copia `packages/client`; o build do web no self-hosted e no deploy de produção continua igual.
- Cypress continua em `apps/web`, rodando contra o web.
- Docs: `AGENTS.md` e `plans/05-web-plan.md` passam a dizer `packages/client/src/modules/...` onde hoje dizem `apps/web/src`.

## Fora do escopo
Porta `Platform` (DESK-03). Servidor em tempo de execução e token (DESK-04). `apps/desktop` (DESK-05). Qualquer mudança de comportamento ou de UI.

## Checklist
- [x] `packages/client` com `package.json`, `tsconfig`, Vitest e Storybook
- [x] Código movido com `git mv`, imports `@/` resolvendo
- [x] `apps/web` como casca, `npm run dev` e `npm run build` iguais
- [x] Router plugin gerando as rotas no pacote
- [x] Tailwind enxergando o pacote (estilos iguais, conferidos no Storybook e no web)
- [x] shadcn adicionando componentes no pacote
- [x] Dockerfile do web buildando (`docker build -f apps/web/Dockerfile .`)
- [x] Cypress verde
- [x] Typecheck, lint, format e testes na raiz
- [x] Docs atualizadas
- [x] Commit a cada passo verde

## Checklist de validação
Rodar e colar o resultado nas notas da execução:
- [x] `npm run typecheck`, `npm run lint`, `npm run format:check` e `npm test` na raiz, todos verdes, com o mesmo número de testes de antes (web hoje: contar antes de mover)
- [x] Storybook: `npm run storybook` abre e os testes das stories (projeto `storybook` do Vitest) passam
- [x] `npm run build -w web` gera o `dist/` e `npm run dev` serve o app em `localhost:5173` com login funcionando contra a API local
- [x] `git diff --stat dev` mostra os arquivos como renomeados (R), não apagados e criados
- [x] `grep -rn "apps/" packages/client/src` sem resultado de import
- [x] `docker build -f apps/web/Dockerfile .` termina sem erro
- [x] Cypress (`npm run e2e -w web`) verde, ou anotado nas notas se a stack não pôde subir

## Critério de aceite
O web funciona exatamente como antes, todos os testes e stories passam, e nada em `packages/client` importa de `apps/*`.

## Notas da execução (2026-10-28)

Feito por mim (Claude). Uma primeira tentativa delegada ao opencode (agente gratuito `opencode-big-pickle`) foi descartada: terminou sem commit, com testes faltando (979 em vez de 1246), pastas duplicadas e o índice do Git inconsistente. Refeito do zero a partir do commit do plano.

O que foi feito:
- `git mv` de `apps/web/src/{app,modules,shared,fixtures,docs}` para `packages/client/src`, de `.storybook`, `components.json`, `.oxlintrc.json` e `vitest.shims.d.ts` para `packages/client`. Os 724 arquivos movidos aparecem como renomeados (R) sem mudança de conteúdo.
- `packages/client` (`@gameplay/client`): `package.json` com todas as dependências de runtime do front-end e as de dev de Storybook, Vitest, lint e Tailwind; exporta o código-fonte (`.` e `./styles.css`), sem build. `src/index.ts` carrega o i18n e exporta o `App`. `vite.config.ts` com o router plugin, React, Tailwind e os projetos `unit` e `storybook` do Vitest. `@/` resolve para `packages/client/src`.
- `apps/web` virou casca: `main.tsx` monta o `App` do pacote; `index.css` importa o tema por caminho relativo (`../../../packages/client/src/styles/theme.css`, escolha do usuário) e usa `@source` no pacote; o `vite.config.ts` aponta o router plugin e o alias `@` para o pacote e mantém Sentry e proxy; `package.json` ficou com `@gameplay/client`, react, react-dom e as dependências de build e do Cypress; `.oxlintrc.json` só com as regras base (as fronteiras do MVVM ficaram no client).
- `npm run storybook` da raiz agora filtra por `@gameplay/client`.
- `AGENTS.md` e `plans/05-web-plan.md` atualizados para os novos caminhos.

Validação (comandos rodados e resultado):
- Antes de mover: 175 arquivos e 1246 testes. Depois: `npm test` na raiz com 175 arquivos e 1246 testes no `@gameplay/client` (iguais). API 375, env 14 e self-hosted 18 sem mudança.
- `npm run typecheck`, `npm run lint` e `npm run format:check` na raiz verdes. `npm run e2e:typecheck -w web` verde.
- Storybook: `storybook build` no pacote concluiu (155 assets) e as 33 stories do admin e as demais rodam no projeto `storybook` do Vitest.
- Build do web: 104 assets, igual ao de antes. O CSS ficou 28 bytes menor: a classe `min-h-full`, usada só no `preview.tsx` do Storybook, deixou de entrar no CSS de produção porque o Tailwind do web não varre mais o `.storybook`. Todas as outras regras são idênticas.
- `npm run dev` com a API local (3333): login com o admin de dev funcionou e a home carregou, sem erros de página.
- Cypress (`npm run e2e` em `apps/web`, API e Vite no ar): 9 specs, 35 testes, todos passando.
- `docker build -f apps/web/Dockerfile .` terminou sem erro e a imagem tem os mesmos 104 assets. O `turbo prune web` já inclui o `packages/client` por ser dependência do web, então o Dockerfile não mudou.
- `grep` por `apps/` em `packages/client`: só dois comentários citando `apps/api`. Nenhum import.
- `host:start` e `npm run deploy` não foram rodados (o deploy é o mesmo `docker build` do web, validado acima).

Suposições:
- *(suposição)* O `index.css` do web não é detectado pelo Git como renomeação do tema (o arquivo de mesmo nome continua existindo), então o histórico do `theme.css` começa aqui; `git log --follow` não o liga ao `index.css` antigo.
- *(suposição)* O typecheck do web também confere os arquivos do client que ele importa, então o código é checado duas vezes (no web e no client). Aceitei o custo pela simplicidade; se pesar, o web pode passar a referenciar o projeto do client.
- *(suposição)* Os specs, stories e o `.storybook` não entram mais no `tsc` do web, só no do client.
- O banco de dev (`gameplay` em `localhost:5432`) estava sem tabelas; apliquei as migrations e criei o admin de dev para testar o login. Não mexi no banco do self-hosted nem no de produção.
